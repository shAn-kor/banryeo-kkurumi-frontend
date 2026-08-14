#!/usr/bin/env bash
# Owns only an e2e-* Compose project. The app is always reached through the
# E2E Vite same-origin proxy; no HTTP route interception is involved.
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly STOREFRONT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly FIXTURE_SQL="${STOREFRONT_ROOT}/e2e/fixtures/public-catalog.sql"
readonly Q3_RUNTIME="${Q3_RUNTIME:-${SCRIPT_DIR}/q3-runtime.sh}"
readonly PROJECT_PREFIX="banryeo-q3-"

usage() {
  cat <<'USAGE'
Usage:
  e2e-public-runtime.sh config <e2e-run-id> <api-port>
  e2e-public-runtime.sh up     <e2e-run-id> <api-port>
  e2e-public-runtime.sh seed   <e2e-run-id>
  e2e-public-runtime.sh down   <e2e-run-id>
  e2e-public-runtime.sh run    <e2e-run-id> <api-port> <storefront-port>

Only run ids beginning with e2e- are accepted. `run` tears down the exact
derived Compose project and its volumes before setup, then always tears it down.
BANRYEO_BACKEND_ROOT may point to either the banryeo-kkurumi project root or
its backend directory.
USAGE
}

fail() {
  echo "e2e-public-runtime: $*" >&2
  exit 2
}

resolve_backend_root() {
  local default_project_root
  local candidate
  default_project_root="$(cd "${STOREFRONT_ROOT}/.." && pwd)/banryeo-kkurumi"
  candidate="${BANRYEO_BACKEND_ROOT:-${default_project_root}}"

  if [[ -f "${candidate}/compose.public.yml" ]]; then
    (cd "${candidate}" && pwd)
    return
  fi
  if [[ -f "${candidate}/backend/compose.public.yml" ]]; then
    (cd "${candidate}/backend" && pwd)
    return
  fi
  fail "backend compose file is missing under ${candidate}"
}

readonly BACKEND_ROOT="$(resolve_backend_root)"
readonly COMPOSE_FILE="${BACKEND_ROOT}/compose.public.yml"

validate_run_id() {
  local run_id="$1"
  [[ "${run_id}" =~ ^e2e-[a-z0-9]+(-[a-z0-9]+)*$ ]] || fail "run id must begin with e2e- and use lowercase alphanumeric segments"
  (( ${#run_id} <= 40 )) || fail "run id must be at most 40 characters"
}

validate_port() {
  local port="$1"
  [[ "${port}" =~ ^[1-9][0-9]{0,4}$ ]] || fail "invalid host port"
  (( 10#${port} <= 65535 )) || fail "invalid host port"
}

project_for() {
  local run_id="$1"
  validate_run_id "${run_id}"
  printf '%s%s\n' "${PROJECT_PREFIX}" "${run_id}"
}

compose_for() {
  local run_id="$1"
  local project
  project="$(project_for "${run_id}")"
  [[ -f "${COMPOSE_FILE}" ]] || fail "compose.public.yml is missing"
  shift
  docker compose -p "${project}" -f "${COMPOSE_FILE}" "$@"
}

wait_for_api() {
  local api_port="$1"
  local attempt
  for attempt in $(seq 1 90); do
    if curl --fail --silent --show-error "http://127.0.0.1:${api_port}/api/v1/categories" >/dev/null; then
      return 0
    fi
    sleep 1
  done
  fail "public API did not become ready at 127.0.0.1:${api_port}"
}

seed_fixture() {
  local run_id="$1"
  [[ -f "${FIXTURE_SQL}" ]] || fail "fixture SQL is missing"
  compose_for "${run_id}" exec -T mysql sh -ec 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' <"${FIXTURE_SQL}"
}

verify_fixture() {
  local run_id="$1"
  local actual
  local sql
  read -r -d '' sql <<'SQL' || true
SELECT CONCAT((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name IN ('reference_id', 'category_reference_id', 'brand_reference_id')), ':', (SELECT COUNT(*) FROM categories WHERE name = 'E2E Pet Food' AND deleted_at IS NULL), ':', (SELECT COUNT(*) FROM products WHERE name IN ('E2E Salmon Food', 'E2E Duck Treat') AND stock = 12 AND deleted_at IS NULL), ':', (SELECT COUNT(*) FROM brands WHERE name = 'E2E-Pet-Brand' AND deleted_at IS NULL));
SQL
  actual="$(compose_for "${run_id}" exec -T mysql sh -ec 'exec mysql -N -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "$1"' -- "${sql}")"
  [[ "${actual}" == "3:1:2:1" ]] || fail "fixture/schema verification failed: expected columns:category:products:brand as 3:1:2:1, got ${actual}"
}

cleanup_run() {
  local run_id="$1"
  local tls_dir="$2"
  "${Q3_RUNTIME}" down "${run_id}" || true
  rm -rf "${tls_dir}"
}

run_all() {
  local run_id="$1"
  local api_port="$2"
  local storefront_port="$3"
  local tls_dir
  validate_port "${api_port}"
  validate_port "${storefront_port}"
  [[ "${api_port}" != "${storefront_port}" ]] || fail "API and storefront ports must differ"

  command -v openssl >/dev/null || fail "openssl is required to create the local E2E TLS certificate"
  tls_dir="$(mktemp -d)"
  trap "cleanup_run '${run_id}' '${tls_dir}'" EXIT INT TERM
  openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
    -keyout "${tls_dir}/key.pem" \
    -out "${tls_dir}/cert.pem" \
    -subj '/CN=127.0.0.1' \
    -addext 'subjectAltName = IP:127.0.0.1,DNS:localhost' >/dev/null 2>&1
  "${Q3_RUNTIME}" down "${run_id}"
  "${Q3_RUNTIME}" up "${run_id}" "${api_port}"
  wait_for_api "${api_port}"
  seed_fixture "${run_id}"
  verify_fixture "${run_id}"
  (
    cd "${STOREFRONT_ROOT}"
    E2E_API_ORIGIN="http://127.0.0.1:${api_port}" \
    E2E_BASE_URL="https://127.0.0.1:${storefront_port}" \
    E2E_RUN_ID="${run_id}" \
    E2E_STOREFRONT_PORT="${storefront_port}" \
    E2E_TLS_KEY="${tls_dir}/key.pem" \
    E2E_TLS_CERT="${tls_dir}/cert.pem" \
      npm exec playwright test
  )
}

main() {
  local operation="${1:-}"
  case "${operation}" in
    config|up)
      [[ $# -eq 3 ]] || fail "${operation} requires an e2e run id and API port"
      validate_run_id "$2"; validate_port "$3"
      "${Q3_RUNTIME}" "${operation}" "$2" "$3"
      ;;
    seed)
      [[ $# -eq 2 ]] || fail "seed requires an e2e run id"
      validate_run_id "$2"; seed_fixture "$2"; verify_fixture "$2"
      ;;
    down)
      [[ $# -eq 2 ]] || fail "down requires an e2e run id"
      validate_run_id "$2"; "${Q3_RUNTIME}" down "$2"
      ;;
    run)
      [[ $# -eq 4 ]] || fail "run requires an e2e run id, API port, and storefront port"
      validate_run_id "$2"; run_all "$2" "$3" "$4"
      ;;
    *) usage >&2; fail "unknown operation" ;;
  esac
}

main "$@"
