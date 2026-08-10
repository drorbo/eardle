#!/usr/bin/env bash
# Deploy the current `main` branch to the production server and verify it's live.
#
# Usage: bash scripts/deploy-prod.sh
#
# Prerequisites (see docs/deployment.md):
#   - `main` on the remote already has the changes you want live — push it
#     first (git push origin dev:main), this script does not push anything.
#   - SSH access configured as the `eardle-prod` host alias in ~/.ssh/config,
#     pointing at a private key that is NOT part of this repository.
#
# This script contains no credentials — it relies entirely on the local
# machine's own SSH config/key for the `eardle-prod` alias.

set -euo pipefail

REMOTE_DIR="~/drorbo/eardle"
SSH_HOST="eardle-prod"
COMPOSE="docker compose -f docker-compose.yml"

echo "==> Pulling latest main on the server"
ssh "$SSH_HOST" "cd $REMOTE_DIR && git pull origin main"

echo "==> Rebuilding the app image"
ssh "$SSH_HOST" "cd $REMOTE_DIR && $COMPOSE build app"

echo "==> Recreating the app container"
ssh "$SSH_HOST" "cd $REMOTE_DIR && $COMPOSE up -d app"

echo "==> Waiting for startup"
sleep 5

echo "==> Container status"
ssh "$SSH_HOST" "cd $REMOTE_DIR && $COMPOSE ps"

echo "==> Recent app logs"
ssh "$SSH_HOST" "docker logs eardle-app-1 --tail 15"

echo "==> Verifying the public site"
curl -s -o /dev/null -w 'homepage:    %{http_code}\n' https://eardle.com/
curl -s -o /dev/null -w 'learn page:  %{http_code}\n' https://eardle.com/learn
curl -s -o /dev/null -w 'piano page:  %{http_code}\n' https://eardle.com/piano

echo "==> Deploy complete"
