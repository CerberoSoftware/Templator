# eTemplator

Arctic-themed internal tool for building responsive, highly compatible HTML email
templates. Drag-and-drop blocks restricted to table-based structures, an inline-CSS
engine, Outlook VML support, multi-client preview, versioning and an asset manager.

Stack: PHP 8.2+ (no framework) + MySQL on SiteGround, React + TypeScript + Vite frontend.

## Local development

Requirements: Node 18+, Docker (or any local PHP 8.3 + MySQL).

```bash
npm install

docker compose up -d
docker compose exec php php scripts/hash.php 'your-password'   # prints bcrypt hash
cp app/config.example.php app/config.php
# edit app/config.php: paste the hash into auth.password_hash
docker compose exec php php scripts/migrate.php

npm run dev        # Vite dev server on http://localhost:5173 (proxies /api to :8080)
```

The API is also reachable directly at http://localhost:8181 (PHP built-in server).

## Production build

```bash
npm run build      # outputs to public/assets + manifest
```

Serving is handled by `index.php` + `.htaccess` (SPA fallback, `/api/*` routing,
static files under `/assets` and `/uploads`).

## Deploy to SiteGround

1. Create a MySQL database + user in Site Tools (MySQL section).
2. Copy `app/config.example.php` to `app/config.php` on the server and fill in
   DB credentials and your bcrypt password hash (`php scripts/hash.php 'pw'`).
3. Deploy:

```bash
./scripts/deploy.sh user@server.siteground.eu /home/customer/www/app.yourdomain.com/public_html --migrate
```

Everything except `app/config.php` and `public/uploads/` is overwritten on deploy;
both are safe. SSH access is available on all SiteGround plans.

## Tests

```bash
npm test          # engine tests (renderer, inliner, parser, importer)
```

## Security notes

- All API routes except `/api/auth/login` + `/api/auth/health` require a session.
- Mutating requests require the `X-CSRF-Token` header (double-submit with session).
- Uploads: images only (PNG/JPEG/GIF/WebP), 2 MB limit, random file names,
  reference-checked before deletion.
- `.htaccess` blocks `app/`, `migrations/`, `src/`, `.git/`, config and build files.
- Preview iframes are sandboxed (no scripts inside email HTML ever execute).

## Layout

```
index.php            front controller (API + SPA shell)
app/                 PHP backend (Core, Controllers, Repos, config)
migrations/          SQL migrations (applied by scripts/migrate.php)
public/assets/       built frontend (gitignored)
public/uploads/      uploaded images (gitignored)
src/                 React app (builder engine lives in src/builder)
tests/               engine unit tests (vitest)
```
