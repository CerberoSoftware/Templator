#!/usr/bin/env bash
# eTemplator — start everything in OrbStack (idempotent; safe to run anytime).
# Usage: ./start.sh
set -euo pipefail
cd "$(dirname "$0")"

# 1. Build + start containers (OrbStack's Docker engine is used automatically)
docker compose up -d --build

# 2. One-time: create app/config.php with a generated login password
if [ ! -f app/config.php ]; then
  PW="arctic-$(openssl rand -hex 6)"
  cp app/config.example.php app/config.php
  docker compose exec -e ET_PW="$PW" php php -r '
    $f = file_get_contents("/app/app/config.php");
    $h = password_hash(getenv("ET_PW"), PASSWORD_BCRYPT);
    file_put_contents("/app/app/config.php", str_replace("REPLACE_WITH_BCRYPT_HASH", $h, $f));
    if (!password_verify(getenv("ET_PW"), (require "/app/app/config.php")["auth"]["password_hash"])) {
        fwrite(STDERR, "Failed to set password hash\n");
        exit(1);
    }
  '
  echo ""
  echo "======================================================="
  echo " Login password (generated, shown once): $PW"
  echo " Change later with:"
  echo "   docker compose exec php php scripts/hash.php 'new-pw'"
  echo "   then paste the hash into app/config.php"
  echo "======================================================="
fi

# 3. Apply DB migrations (idempotent — only new ones run)
docker compose exec php php scripts/migrate.php

# 4. Build frontend if not built yet
if [ ! -f public/assets/.vite/manifest.json ]; then
  npm install
  npm run build
fi

echo ""
echo "App:    http://localhost:8181"
echo "MySQL:  127.0.0.1:3307 (db/user/pass: etemplator / etemplator / etemplator, root pw: root)"
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
