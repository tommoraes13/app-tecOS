#!/usr/bin/env bash
# Mostra o resultado da última verificação de uma branch e, se falhou, os erros.
# Uso: scripts/ci-status.sh [branch]
set -euo pipefail
REPO="tommoraes13/app-tecOS"
BRANCH="${1:-dev}"
SHA=$(git rev-parse HEAD)

while :; do
  run=$(gh run list -R "$REPO" --branch "$BRANCH" --commit "$SHA" --limit 1 --json databaseId,status,conclusion -q '.[0] // empty')
  if [ -n "$run" ] && [ "$(jq -r .status <<<"$run")" = "completed" ]; then break; fi
  sleep 10
done

conclusion=$(jq -r .conclusion <<<"$run")
echo "verificacao: $conclusion"
if [ "$conclusion" != "success" ]; then
  id=$(jq -r .databaseId <<<"$run")
  for cr in $(gh api "repos/$REPO/commits/$SHA/check-runs" -q '.check_runs[] | select(.conclusion=="failure") | .id'); do
    gh api "repos/$REPO/check-runs/$cr/annotations" -q '.[] | select(.title | test("\\.log$")) | "--- " + .title + "\n" + .message'
  done
  echo "run: $id"
  exit 1
fi
