#!/usr/bin/env bash
set -euo pipefail
exec node "$(dirname "$0")/registry-consumer.mjs" "$PWD/release-plan.json"
