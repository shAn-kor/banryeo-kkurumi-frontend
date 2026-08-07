#!/usr/bin/env bash
set -euo pipefail

readonly script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly repository_root="$(cd "${script_dir}/../../.." && pwd)"
readonly evidence_dir="${repository_root}/docs/productization/evidence/q3-e1"
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
cd "${repository_root}"

./gradlew :apps:commerce-api:test \
  --tests com.loopers.PublicOpenApiContractIntegrationTest \
  --no-daemon \
  "-Dbanryeo.openapi.capture.output=${artifact_path}"

python3 docs/productization/evidence/q3-e1/capture_manifest.py \
  --artifact "${artifact_path}" \
  --output "${manifest_path}"

python3 docs/productization/evidence/q3-e1/validate.py \
  --artifact "${artifact_path}" \
  --manifest "${manifest_path}" \
  --report "${report_path}" \
  --self-test
