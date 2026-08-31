#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/deploy.sh <ssh-target> <remote-path> [options]

  ssh-target    e.g. sguser@server123.siteground.eu (or an SSH config alias)
  remote-path   absolute path of the app webroot on the server,
                e.g. /home/customer/www/etemplator.yourdomain.com/public_html

Options:
  --skip-build  do not rebuild the frontend (deploy current public/assets)
  --migrate     run scripts/migrate.php on the server after syncing

Environment:
  SG_PHP         PHP binary on the server (default: php8.3 or php)

Steps:
  1. npm install (if needed) + npm run build
  2. rsync the project (excluding dev files, uploads, remote config.php)
  3. optionally run migrations over SSH

The remote app/config.php, public/uploads/ and the .git dir are never touched.
EOF
  exit 1
}

[[ $# -ge 2 ]] || usage
SSH_TARGET="$1"
REMOTE_PATH="$2"
shift 2

SKIP_BUILD=0
RUN_MIGRATE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1 ;;
    --migrate) RUN_MIGRATE=1 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
  shift
done

if [[ $SKIP_BUILD -eq 0 ]]; then
  echo "==> Building frontend"
  [[ -d node_modules ]] || npm install
  npm run build
fi

echo "==> Syncing to ${SSH_TARGET}:${REMOTE_PATH}"
rsync -az --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'src/' \
  --exclude 'tests/' \
  --exclude 'public/uploads/' \
  --exclude 'app/config.php' \
  --exclude 'docker-compose.yml' \
  --exclude '.DS_Store' \
  ./ "${SSH_TARGET}:${REMOTE_PATH}/"

if [[ $RUN_MIGRATE -eq 1 ]]; then
  PHP_BIN="${SG_PHP:-php}"
  echo "==> Running migrations on server"
  ssh "$SSH_TARGET" "cd '${REMOTE_PATH}' && ${PHP_BIN} scripts/migrate.php"
fi

echo "==> Deploy complete."
