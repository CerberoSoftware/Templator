#!/usr/bin/env bash
# =============================================================================
# sg-deploy.sh — Run this ON the SiteGround server to pull & deploy eTemplator
# =============================================================================
# Usage:
#   bash sg-deploy.sh [--migrate] [--skip-build]
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
GITHUB_USER="CerberoUK"
REPO="CerberoSoftware/eTemplator"
DEPLOY_DIR="/home/u1024-ybd75ecffzqg/www/etemplator.cerbero.co/public_html"
PHP_BIN="${SG_PHP:-php-wrapper}"
BRANCH="main"

# This script itself gets rsynced into $DEPLOY_DIR/scripts (the webroot), so
# the GitHub PAT must NOT be hardcoded here — it lives in a file outside the
# webroot instead, e.g.:
#   printf 'GITHUB_PAT=ghp_xxxxx\n' > "$HOME/.etemplator-deploy.env"
#   chmod 600 "$HOME/.etemplator-deploy.env"
SECRET_FILE="${SECRET_FILE:-$HOME/.etemplator-deploy.env}"
# ---------------------------------------------------------------------------

if [[ ! -f "$SECRET_FILE" ]]; then
  echo "ERROR: secret file not found: ${SECRET_FILE}" >&2
  echo "Create it (outside the webroot) with:" >&2
  echo "  printf 'GITHUB_PAT=ghp_xxxxx\\n' > '${SECRET_FILE}'" >&2
  echo "  chmod 600 '${SECRET_FILE}'" >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$SECRET_FILE"

if [[ -z "${GITHUB_PAT:-}" ]]; then
  echo "ERROR: GITHUB_PAT is not set in ${SECRET_FILE}." >&2
  exit 1
fi

RUN_MIGRATE=0
SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --migrate)     RUN_MIGRATE=1 ;;
    --skip-build)  SKIP_BUILD=1 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

BUILD_DIR="$HOME/deploy-build-$$"
trap 'rm -rf "$BUILD_DIR"' EXIT
mkdir -p "$BUILD_DIR"

CLONE_URL="https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${REPO}.git"

echo "==> Cloning ${REPO} (branch: ${BRANCH})"
git clone --depth=1 --branch "$BRANCH" "$CLONE_URL" "$BUILD_DIR"

if [[ $SKIP_BUILD -eq 0 ]]; then
  echo "==> Installing Node dependencies"
  NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    source "$NVM_DIR/nvm.sh"
  fi

  cd "$BUILD_DIR"
  npm install --prefer-offline --no-audit --no-fund

  echo "==> Building frontend (vite)"
  node node_modules/.bin/vite build
else
  echo "==> Skipping frontend build (--skip-build)"
  cd "$BUILD_DIR"
fi

echo "==> Syncing to ${DEPLOY_DIR}"
mkdir -p "$DEPLOY_DIR"

# mkdir -p is a no-op if $DEPLOY_DIR already existed, so it won't have caught
# a pre-existing directory we can't actually traverse into (wrong owner/mode —
# e.g. SiteGround pre-creating the webroot with different permissions when the
# site/subdomain was set up). Catch that here with a clear diagnostic instead
# of letting rsync fail deep inside its own transfer with a cryptic error.
if ! ( cd "$DEPLOY_DIR" 2>/dev/null ); then
  chmod u+rwx "$DEPLOY_DIR" 2>/dev/null || true
fi
if ! ( cd "$DEPLOY_DIR" 2>/dev/null ); then
  echo "ERROR: cannot access ${DEPLOY_DIR} (permission denied)." >&2
  echo "Current ownership/permissions:" >&2
  ls -ld "$DEPLOY_DIR" "$(dirname "$DEPLOY_DIR")" >&2 || true
  echo "Running as: $(id)" >&2
  echo "Fix the directory's owner/permissions (e.g. via Site Tools > File Manager," >&2
  echo "or 'chown \$(whoami) ${DEPLOY_DIR}' if you have the rights) and re-run." >&2
  exit 1
fi

rsync -a --delete \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude 'public/uploads/' \
  "$BUILD_DIR/" "$DEPLOY_DIR/"

# Remove index.html from webroot — it's Vite's dev entry point only.
# Apache must serve index.php, not index.html.
rm -f "${DEPLOY_DIR}/index.html"

mkdir -p "${DEPLOY_DIR}/public/uploads"

if [[ $RUN_MIGRATE -eq 1 ]]; then
  echo "==> Running database migrations"
  "$PHP_BIN" "${DEPLOY_DIR}/scripts/migrate.php"
fi

echo
echo "==> Deploy complete."
echo "    Smoke-test: curl -s https://etemplator.cerbero.co/api/health"
