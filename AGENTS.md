# eTemplator — Base44 Dev Notes

## Stack
PHP 8.3 (built-in server) + MySQL 8.0 backend, React 19 + TypeScript + Vite 8 frontend.
No external services or credentials — only local MySQL and password auth.

## Architecture (Base44 dev)
Single-origin wiring: the Vite dev server (port 3000) is the public entry point.
It proxies `/api` and `/uploads` to the PHP backend (`php` service, internal port 80).
MySQL is internal only (no published host port).

- `web` — node:22, bind-mounted, runs `npx vite --host 0.0.0.0 --port 3000`. Live reload via Vite HMR (watch polling enabled for bind mounts).
- `php` — php:8.3-cli (built from `docker/php.Dockerfile`, adds pdo_mysql), bind-mounted, runs `php -S 0.0.0.0:80 index.php`.
- `migrate` — one-shot, runs `php scripts/migrate.php` then exits. `web` waits for it to complete.
- `mysql` — mysql:8.0 with healthcheck.

## Env vars (compose)
- `VITE_BASE=/` — serves the dev server at root (production uses `/static/`).
- `VITE_PROXY_TARGET=http://php:80` — Vite proxy target for the PHP API.
- `VITE_WATCH_POLLING=1` — enables file-watch polling for bind mounts.
- `ET_DB_*` — MySQL connection (pointed at the `mysql` service).
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` — platform-set, allows the preview host.

## Auth
Password login. The bcrypt hash lives in `app/config.php` (committed; reads `ET_PASSWORD_HASH` env first).
Dev password: **arctic2026**. The committed `config.php` hash is from production and does NOT match
this password; the compose file sets `ET_PASSWORD_HASH` (a bcrypt hash of `arctic2026`) in the `php`
service environment, which `config.php` reads via `getenv()` before falling back to the committed hash.
Login is rate-limited (5 attempts → 60s lock). Sessions use `SameSite=Lax` cookies — works behind the
single-origin Vite proxy.

## config.php
Already committed. Reads `ET_DB_*` and `ET_PASSWORD_HASH` from env first, falling back to
hardcoded values. In compose, `ET_DB_*` env vars override the production fallbacks to point
at the local MySQL service. No need to create or edit `config.php`.

## Migrations
`php scripts/migrate.php` — idempotent, only applies new SQL files from `migrations/`.
Run automatically by the `migrate` compose service on boot.

## Verify
- `curl -s http://localhost:3000/` → Vite-served HTML with `#root`.
- `curl -s http://localhost:3000/api/health` → `{"ok":true,"data":{"status":"ok",...}}`.
- Login at the preview with password `arctic2026`.

## Tests
`npx vitest run` — engine unit tests (renderer, inliner, parser, importer, components).
