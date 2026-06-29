#!/bin/sh
set -eu

OS_URL="${OS_URL:-http://opensearch:9200}"
OS_USER="${OPEN_SEARCH_USER_NAME:-admin}"
OS_PASS="${OPEN_SEARCH_PASSWORD:?OPEN_SEARCH_PASSWORD is required}"
RETENTION_AGE="${TRACE_RETENTION:-}"
if [ -z "${RETENTION_AGE}" ]; then
  RETENTION_DAYS="${TRACE_RETENTION_DAYS:-14}"
  RETENTION_AGE="${RETENTION_DAYS}d"
fi
POLICY_ID="${ISM_POLICY_ID:-jaeger-trace-retention}"
TEMPLATE_NAME="${ISM_TEMPLATE_NAME:-jaeger-trace-retention-template}"
INDEX_PATTERN="${ISM_INDEX_PATTERN:-jaeger-main-*}"
ISM_TEMPLATE_PRIORITY="${ISM_TEMPLATE_PRIORITY:-100}"
ISM_JOB_INTERVAL="${ISM_JOB_INTERVAL:-1}"
ISM_JITTER="${ISM_JITTER:-0}"

echo "Waiting for OpenSearch at ${OS_URL}..."
i=0
until curl -sS -u "${OS_USER}:${OS_PASS}" "${OS_URL}/_cluster/health" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "${i}" -gt 60 ]; then
    echo "OpenSearch did not become ready in time"
    exit 1
  fi
  sleep 2
done

echo "Applying ISM policy ${POLICY_ID} with retention ${RETENTION_AGE}"
curl -sS -u "${OS_USER}:${OS_PASS}" -H "Content-Type: application/json" \
  -X PUT "${OS_URL}/_plugins/_ism/policies/${POLICY_ID}" \
  -d "{
    \"policy\": {
      \"description\": \"Delete Jaeger trace indices after ${RETENTION_AGE}\",
      \"ism_template\": [
        {
          \"index_patterns\": [\"${INDEX_PATTERN}\"],
          \"priority\": ${ISM_TEMPLATE_PRIORITY}
        }
      ],
      \"default_state\": \"hot\",
      \"states\": [
        {
          \"name\": \"hot\",
          \"actions\": [],
          \"transitions\": [
            {
              \"state_name\": \"delete\",
              \"conditions\": {
                \"min_index_age\": \"${RETENTION_AGE}\"
              }
            }
          ]
        },
        {
          \"name\": \"delete\",
          \"actions\": [
            {
              \"delete\": {}
            }
          ],
          \"transitions\": []
        }
      ]
    }
  }" >/dev/null

# Cleanup previous composable template version, if it exists.
# Composable templates override Jaeger's legacy templates and can break mappings.
curl -sS -u "${OS_USER}:${OS_PASS}" \
  -X DELETE "${OS_URL}/_index_template/${TEMPLATE_NAME}" >/dev/null || true

echo "Attaching policy to existing indices that match ${INDEX_PATTERN}"
curl -sS -u "${OS_USER}:${OS_PASS}" -H "Content-Type: application/json" \
  -X POST "${OS_URL}/_plugins/_ism/add/${INDEX_PATTERN}" \
  -d "{\"policy_id\":\"${POLICY_ID}\"}" >/dev/null || true

echo "Setting ISM scheduler: job_interval=${ISM_JOB_INTERVAL}, jitter=${ISM_JITTER}"
curl -sS -u "${OS_USER}:${OS_PASS}" -H "Content-Type: application/json" \
  -X PUT "${OS_URL}/_cluster/settings" \
  -d "{
    \"persistent\": {
      \"plugins.index_state_management.job_interval\": ${ISM_JOB_INTERVAL},
      \"plugins.index_state_management.jitter\": ${ISM_JITTER}
    }
  }" >/dev/null

echo "OpenSearch ISM bootstrap completed"
