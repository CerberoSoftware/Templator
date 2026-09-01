#!/usr/bin/env bash
# =============================================================================
# sg-deploy.sh — Run this ON the SiteGround server to pull & deploy eTemplator
# =============================================================================
# Usage:
#   bash sg-deploy.sh [--migrate] [--skip-build]
#
# Options:
#   --migrate      Run scripts/migrate.php after pulling (recommended on first
#                  deploy and whenever migrations/*.sql files have changed)
#   --skip-build   Skip the frontend npm build step (useful if you only changed
#                  PHP files and public/assets is already up to date)
#
# Safe to re-run: preserves public/uploads/ on every run.
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------------
GITHUB_PAT="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"
GITHUB_USER="CerberoUK"
REPO="CerberoSoftware/eTemplator"

# Absolute path to the app webroot on SiteGround
DEPLOY_DIR="/home/u1024-ybd75ecffzqg/www/etemplator.cerbero.co/public_html"

# PHP binary — SiteGround exposes php-wrapper in PATH
PHP_BIN="${SG_PHP:-php-wrapper}"

# Branch to deploy
BRANCH="main"
# ---------------------------------------------------------------------------

# Parse flags
RUN_MIGRATE=0
SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --migrate)     RUN_MIGRATE=1 ;;
    --skip-build)  SKIP_BUILD=1 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Clone into $HOME/deploy-build (NOT /tmp — SiteGround mounts /tmp noexec)
# ---------------------------------------------------------------------------
BUILD_DIR="$HOME/deploy-build-$$"
trap 'rm -rf "$BUILD_DIR"' EXIT
mkdir -p "$BUILD_DIR"

CLONE_URL="https://${GITHUB_USER}:${GITHUB_PAT}@github.com/${REPO}.git"

echo "==> Cloning ${REPO} (branch: ${BRANCH})"
git clone --depth=1 --branch "$BRANCH" "$CLONE_URL" "$BUILD_DIR"

# ---------------------------------------------------------------------------
# Build frontend
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# Sync to deploy directory
# ---------------------------------------------------------------------------
echo "==> Syncing to ${DEPLOY_DIR}"
mkdir -p "$DEPLOY_DIR"

rsync -a --delete \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude 'public/uploads/' \
  "$BUILD_DIR/" "$DEPLOY_DIR/"

mkdir -p "${DEPLOY_DIR}/public/uploads"

# ---------------------------------------------------------------------------
# Migrations
# ---------------------------------------------------------------------------
if [[ $RUN_MIGRATE -eq 1 ]]; then
  echo "==> Running database migrations"
  "$PHP_BIN" "${DEPLOY_DIR}/scripts/migrate.php"
fi

echo
echo "==> Deploy complete."
echo "    Smoke-test: curl -s https://etemplator.cerbero.co/api/health"
