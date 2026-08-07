#!/usr/bin/env bash
# Safe lifecycle seam for one isolated BANRYEO KKURUMI Q3 datastore fixture.
set -euo pipefail

readonly PROJECT_PREFIX="banryeo-q3-"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
readonly COMPOSE_FILE="${REPOSITORY_ROOT}/compose.public.yml"

usage() {
  cat <<'USAGE'
Usage:
  q3-runtime.sh config <run-id> <host-port>
  q3-runtime.sh up     <run-id> <host-port>
  q3-runtime.sh down   <run-id>

run-id must contain only lowercase letters, digits, and single hyphens between
alphanumeric segments. The Compose project is always derived as banryeo-q3-<run-id>.
USAGE
}

fail() {
  echo "q3-runtime: $*" >&2
  exit 2
}

validate_run_id() {
  local run_id="$1"
  [[ "${run_id}" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || fail "invalid run id"
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

compose_for_project() {
  local project="$1"
  shift
  [[ "${project}" =~ ^banryeo-q3-[a-z0-9]+(-[a-z0-9]+)*$ ]] || fail "unsafe cleanup target"
  [[ -f "${COMPOSE_FILE}" ]] || fail "compose.public.yml is missing"
  docker compose -p "${project}" -f "${COMPOSE_FILE}" "$@"
}

main() {
  local operation="${1:-}"
  local run_id="${2:-}"
  local project

  case "${operation}" in
    config|up)
      [[ $# -eq 3 ]] || { usage >&2; fail "${operation} requires a run id and host port"; }
      validate_port "$3"
      project="$(project_for "${run_id}")"
      if [[ "${operation}" == "config" ]]; then
        PUBLIC_API_PORT="$3" compose_for_project "${project}" config
      else
        PUBLIC_API_PORT="$3" compose_for_project "${project}" up --build --detach --wait
      fi
      ;;
    down)
      [[ $# -eq 2 ]] || { usage >&2; fail "down requires a run id only"; }
      project="$(project_for "${run_id}")"
      compose_for_project "${project}" down --volumes --remove-orphans
      ;;
    *)
      usage >&2
      fail "unknown operation"
      ;;
  esac
}

main "$@"
