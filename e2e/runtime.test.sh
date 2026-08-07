#!/usr/bin/env bash
# Non-mutating safety tests for the E2E lifecycle wrapper.
set -euo pipefail

readonly E2E_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly RUNTIME="${E2E_ROOT}/../scripts/e2e-public-runtime.sh"
readonly TEST_TMP="$(mktemp -d)"
trap 'rm -rf "${TEST_TMP}"' EXIT

fail() { echo "runtime.test: $*" >&2; exit 1; }

expect_rejected() {
  if Q3_RUNTIME="${TEST_TMP}/q3-runtime" "${RUNTIME}" "$@" >/dev/null 2>&1; then
    fail "unsafe input was accepted: $*"
  fi
}

cat >"${TEST_TMP}/q3-runtime" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$@" >>"${E2E_CAPTURE:?}"
STUB
chmod +x "${TEST_TMP}/q3-runtime"

E2E_CAPTURE="${TEST_TMP}/capture" Q3_RUNTIME="${TEST_TMP}/q3-runtime" "${RUNTIME}" config e2e-alpha-1 18080
diff -u <(printf 'config\ne2e-alpha-1\n18080\n') "${TEST_TMP}/capture" >/dev/null || fail "config did not preserve the validated contract"

for unsafe in 'alpha-1' 'e2e-Alpha' 'e2e_alpha' 'e2e-../alpha' 'e2e-alpha;docker' 'e2e--alpha'; do
  expect_rejected down "${unsafe}"
done
expect_rejected config e2e-alpha-1 0
expect_rejected config e2e-alpha-1 65536
expect_rejected run e2e-alpha-1 18080 18080
expect_rejected down e2e-alpha-1 18080

echo "e2e runtime safety tests passed: e2e-only run ids, strict ports, and delegated lifecycle arguments."
