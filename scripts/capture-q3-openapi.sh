#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly FRONTEND_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

fail() {
  echo "capture-q3-openapi: $*" >&2
  exit 2
}

resolve_backend_root() {
  local default_project_root
  local candidate
  default_project_root="$(cd "${FRONTEND_ROOT}/.." && pwd)/banryeo-kkurumi"
  candidate="${BANRYEO_BACKEND_ROOT:-${default_project_root}}"

  if [[ -f "${candidate}/gradlew" ]]; then
    (cd "${candidate}" && pwd)
    return
  fi
  if [[ -f "${candidate}/backend/gradlew" ]]; then
    (cd "${candidate}/backend" && pwd)
    return
  fi
  fail "backend Gradle wrapper is missing under ${candidate}"
}

readonly BACKEND_ROOT="$(resolve_backend_root)"
readonly evidence_dir="${BACKEND_ROOT}/docs/productization/evidence/q3-e1"
readonly artifact_path="${evidence_dir}/public-openapi.json"
readonly manifest_path="${evidence_dir}/manifest.json"
readonly report_path="${evidence_dir}/validation.json"

case "${artifact_path}" in
  "${evidence_dir}"/*) ;;
  *)
    echo "OpenAPI artifact path must stay inside ${evidence_dir}" >&2
    exit 1
    ;;
esac

mkdir -p "${evidence_dir}"
cd "${BACKEND_ROOT}"

./gradlew :apps:commerce-api:test \
  --tests com.loopers.PublicOpenApiContractIntegrationTest \
  --no-daemon \
  "-Dbanryeo.openapi.capture.output=${artifact_path}"

python3 "${evidence_dir}/capture_manifest.py" \
  --artifact "${artifact_path}" \
  --output "${manifest_path}"

python3 "${evidence_dir}/validate.py" \
  --artifact "${artifact_path}" \
  --manifest "${manifest_path}" \
  --report "${report_path}" \
  --self-test
