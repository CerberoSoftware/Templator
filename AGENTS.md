# Templator 2 — Base44 Dev Notes

## Stack
PHP 8.3 (built-in server) + SQLite backend, React 19 + TypeScript + Vite 8 frontend.
No external services or credentials — SQLite database stored in a Docker named volume.

## Architecture (Base44 dev)
Single-origin wiring: the Vite dev server (port 3000) is the public entry point.
It proxies `/api` and `/uploads` to the PHP backend (`php` service, internal port 80).

- `web` — node:22, bind-mounted, runs `npx vite --host 0.0.0.0 --port 3000`. Live reload via Vite HMR (watch polling enabled for bind mounts).
- `php` — php:8.3-cli (built from `docker/php.Dockerfile`), bind-mounted, runs `php -S 0.0.0.0:80 index.php`.
- `migrate` — one-shot, runs `php scripts/migrate.php` then exits. `web` waits for it to complete.

## Read-only mode
All POST/PUT/DELETE requests are rejected with a 403 "read-only" error in the Router.
The app loads without login (auth store defaults to `authed`). No auth UI is shown.
This makes the app safe to publish publicly with no persistent changes.

## Database
SQLite file at `/app/data/database.sqlite` (Docker named volume `db-data`).
`scripts/migrate.php` creates all tables (idempotent with `IF NOT EXISTS`) and seeds:
- `settings` table with `brand_fonts: []`
- `quickstart_templates` table with 10 built-in templates (via `scripts/seed_quickstart.php`)

The original MySQL migration files in `migrations/` are kept as schema documentation.
The `seed_quickstart.php` script reads `migrations/004_quickstart_templates.sql`, fixes
MySQL backslash escaping for SQLite (`\\` → `\`), and inserts via PDO.

## Env vars (compose)
- `VITE_BASE=/` — serves the dev server at root (production uses `/static/`).
- `VITE_PROXY_TARGET=http://php:80` — Vite proxy target for the PHP API.
- `VITE_WATCH_POLLING=1` — enables file-watch polling for bind mounts.
- `ET_DB_PATH=/app/data/database.sqlite` — SQLite database file path.
- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` — platform-set, allows the preview host.

## config.php
Already committed. Reads `ET_DB_PATH` from env first, falling back to `__DIR__/../database.sqlite`.

## Verify
- `curl -s http://localhost:3000/` → Vite-served HTML with `#root`.
- `curl -s http://localhost:3000/api/health` → `{"ok":true,"data":{"status":"ok",...}}`.
- `curl -s http://localhost:3000/api/quickstart` → 10 seeded templates.
- POST/PUT/DELETE → 403 read-only error.

## Tests
`npx vitest run` — engine unit tests (renderer, inliner, parser, importer, components).
