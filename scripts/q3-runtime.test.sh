#!/usr/bin/env bash
# Non-mutating contract tests. `config` renders Compose, while a temporary Docker
# stub records the `up` contract without starting a container lifecycle.
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly RUNTIME="${SCRIPT_DIR}/q3-runtime.sh"
readonly REPOSITORY_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
readonly DEFAULT_PROJECT_ROOT="$(cd "${REPOSITORY_ROOT}/../.." && pwd)/banryeo-kkurumi"
if [[ -f "${DEFAULT_PROJECT_ROOT}/compose.public.yml" ]]; then
  readonly DEFAULT_BACKEND_ROOT="${DEFAULT_PROJECT_ROOT}"
else
  readonly DEFAULT_BACKEND_ROOT="${DEFAULT_PROJECT_ROOT}/backend"
fi
readonly TEST_TMP="$(mktemp -d)"
trap 'rm -rf "${TEST_TMP}"' EXIT

fail() {
  echo "q3-runtime.test: $*" >&2
  exit 1
}

expect_rejected() {
  if "${RUNTIME}" "$@" >/dev/null 2>&1; then
    fail "unsafe input was accepted: $*"
  fi
}

render() {
  local run_id="$1"
  local port="$2"
  "${RUNTIME}" config "${run_id}" "${port}" >"${TEST_TMP}/${run_id}.yaml"
}

assert_contains() {
  local file="$1"
  local expected="$2"
  grep -Fq -- "${expected}" "${file}" || fail "missing '${expected}' in ${file}"
}

assert_arguments() {
  local actual="$1"
  shift
  diff -u <(printf '%s\n' "$@") "${actual}" >/dev/null || fail "unexpected docker arguments for setup contract"
}

assert_setup_contract() {
  local capture="${TEST_TMP}/up.arguments"
  local stub_bin="${TEST_TMP}/bin"

  mkdir -p "${stub_bin}"
  cat >"${stub_bin}/docker" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$@" >"${DOCKER_CAPTURE:?DOCKER_CAPTURE is required}"
STUB
  chmod +x "${stub_bin}/docker"

  PATH="${stub_bin}:${PATH}" DOCKER_CAPTURE="${capture}" "${RUNTIME}" up alpha-1 18081
  assert_arguments "${capture}" \
    compose -p banryeo-q3-alpha-1 -f "${DEFAULT_BACKEND_ROOT}/compose.public.yml" \
    up --build --detach --wait
}

main() {
  local first="alpha-1"
  local second="beta-2"
  local first_render="${TEST_TMP}/${first}.yaml"
  local second_render="${TEST_TMP}/${second}.yaml"

  render "${first}" 18081
  render "${second}" 18082

  assert_contains "${first_render}" "mysqladmin"
  assert_contains "${first_render}" "-uapplication"
  assert_contains "${first_render}" "${DEFAULT_BACKEND_ROOT}/docker/mysql/init/01-schema.sql"

  for resource in "${PROJECT_PREFIX:-banryeo-q3-}${first}_public-mysql-data" "${PROJECT_PREFIX:-banryeo-q3-}${first}_public-redis-data" "${PROJECT_PREFIX:-banryeo-q3-}${first}_default"; do
    assert_contains "${first_render}" "${resource}"
    if grep -Fq "${resource}" "${second_render}"; then
      fail "resource collision: ${resource}"
    fi
  done

  for resource in "banryeo-q3-${second}_public-mysql-data" "banryeo-q3-${second}_public-redis-data" "banryeo-q3-${second}_default"; do
    assert_contains "${second_render}" "${resource}"
    if grep -Fq "${resource}" "${first_render}"; then
      fail "resource collision: ${resource}"
    fi
  done

  expect_rejected config 'Alpha-1' 18081
  expect_rejected config 'alpha_1' 18081
  expect_rejected config '../alpha' 18081
  expect_rejected config 'alpha;docker' 18081
  expect_rejected config 'alpha--1' 18081
  expect_rejected config alpha-1 0
  expect_rejected config alpha-1 65536
  expect_rejected config alpha-1 018081
  expect_rejected down '../alpha'
  expect_rejected down 'alpha;docker'
  expect_rejected down alpha 18081
  assert_setup_contract

  echo "q3-runtime tests passed: isolated compose names, invalid inputs, and the --build setup contract verified without container lifecycle operations."
}

main
