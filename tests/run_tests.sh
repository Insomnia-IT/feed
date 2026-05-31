#!/usr/bin/env bash

set -o pipefail

export NREPS="${NREPS:-1}"
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-feed-tests-${GITHUB_RUN_ID:-local}-$$}"

cleanup() {
    docker compose down --remove-orphans --volumes
}

trap cleanup EXIT

cleanup

echo "Gonna explicitly build docker compose for regress-tests"
docker compose build
build_exitcode=$?
if [ "$build_exitcode" -ne 0 ]; then
    exit "$build_exitcode"
fi

echo "Gonna run regress-tests in docker compose"

# docker compose run --remove-orphans easy_test |tee /tmp/tests.log
docker compose run --rm tests | tee /tmp/tests.log
exitcode=${PIPESTATUS[0]}

rm -rf /tmp/tests.short.log
cat /tmp/tests.log | sed -n "/ test session starts /,/^=========/p" | head -n -1 >> /tmp/tests.short.log
cat /tmp/tests.log | sed -n "/ short test summary info /,/^=========/p" | head -n -1 >> /tmp/tests.short.log
cat /tmp/tests.log | grep "^====.*passed in " >> /tmp/tests.short.log

echo -e "\n:CLEAN OUTPUT:\n"
cat /tmp/tests.short.log

echo -e "\n:VERDICT:"
[ $exitcode -eq 0 ] &&
    { echo "Tests passed!"; } ||
    { echo "Tests failed!" ; (exit 2); }

exit "$exitcode"
