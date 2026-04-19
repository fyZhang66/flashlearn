#!/usr/bin/env bash
# Generate traffic against a running FlashLearn instance so Grafana dashboards
# and Jaeger traces have something interesting to show.
#
# Usage:
#   ./scripts/load.sh                         # defaults to localhost:3000
#   BASE=http://localhost:3000 ./scripts/load.sh
#   DURATION=120 CONCURRENCY=8 ./scripts/load.sh

set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
DURATION="${DURATION:-60}"        # seconds
CONCURRENCY="${CONCURRENCY:-4}"   # parallel workers
USER_PREFIX="${USER_PREFIX:-loader}"
PASSWORD="loadtestpw"

echo "Target:       $BASE"
echo "Duration:     ${DURATION}s"
echo "Concurrency:  $CONCURRENCY"
echo

worker() {
  local id=$1
  local user="${USER_PREFIX}_${id}_$RANDOM"
  local jar
  jar=$(mktemp)
  trap 'rm -f "$jar"' EXIT

  curl -s -c "$jar" -X POST \
    -H 'content-type: application/json' \
    -d "{\"username\":\"$user\",\"password\":\"$PASSWORD\"}" \
    "$BASE/api/register" >/dev/null || true

  curl -s -c "$jar" -b "$jar" -X POST \
    -H 'content-type: application/json' \
    -d "{\"username\":\"$user\",\"password\":\"$PASSWORD\"}" \
    "$BASE/api/session" >/dev/null

  local end=$(( $(date +%s) + DURATION ))
  local card_ids=()

  while [ "$(date +%s)" -lt "$end" ]; do
    local roll=$(( RANDOM % 100 ))

    if [ "$roll" -lt 30 ]; then
      # create a card
      local front="front-$RANDOM"
      local explain="explain-$RANDOM"
      local resp
      resp=$(curl -s -b "$jar" -X POST \
        -H 'content-type: application/json' \
        -d "{\"front\":\"$front\",\"explain\":\"$explain\"}" \
        "$BASE/api/card")
      local cid
      cid=$(echo "$resp" | sed -E 's/.*"cardId":"([^"]+)".*/\1/')
      [ -n "$cid" ] && card_ids+=("$cid")
    elif [ "$roll" -lt 60 ] && [ "${#card_ids[@]}" -gt 0 ]; then
      # review a random card
      local idx=$(( RANDOM % ${#card_ids[@]} ))
      local ratings=("hard" "good" "easy")
      local rating="${ratings[$((RANDOM % 3))]}"
      curl -s -b "$jar" -X POST \
        -H 'content-type: application/json' \
        -d "{\"reviewOption\":\"$rating\"}" \
        "$BASE/api/card/${card_ids[$idx]}/review" >/dev/null || true
    elif [ "$roll" -lt 85 ]; then
      # list cards
      curl -s -b "$jar" "$BASE/api/cards" >/dev/null
    else
      # stats
      curl -s -b "$jar" "$BASE/api/cards/stats" >/dev/null
    fi
  done

  echo "  [worker $id] done — created ${#card_ids[@]} cards"
}

pids=()
for i in $(seq 1 "$CONCURRENCY"); do
  worker "$i" &
  pids+=($!)
done

for pid in "${pids[@]}"; do
  wait "$pid"
done

echo
echo "Load complete. Check:"
echo "  Grafana:    http://localhost:3001/d/flashlearn-main"
echo "  Prometheus: http://localhost:9090/graph"
echo "  Jaeger:     http://localhost:16686"
echo "  Kibana:     http://localhost:5601 (index 'fluentbit-*')"
