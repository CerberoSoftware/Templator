<?php
declare(strict_types=1);

require __DIR__ . '/app/bootstrap.php';

use Et\Core\Router;

// Serve static assets via PHP to bypass SiteGround nginx DT (Deny Type) block
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (preg_match('#^/(static|uploads)/#', $path)) {
    $file = __DIR__ . '/public' . $path;
    $real = is_file($file) ? realpath($file) : false;
    if ($real !== false && str_starts_with($real, __DIR__ . '/public')) {
        $ext = pathinfo($real, PATHINFO_EXTENSION);
        header('Content-Type: ' . mime_for($ext));
        header('Content-Length: ' . (string) filesize($real));
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($real);
        exit;
    }
    http_response_code(404);
    exit;
}

$router = new Router();
require __DIR__ . '/app/routes.php';
$router->dispatch();

function mime_for(string $ext): string
{
    return match (strtolower($ext)) {
        'js', 'mjs' => 'text/javascript; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        'json', 'map' => 'application/json; charset=utf-8',
        'png' => 'image/png',
        'jpg', 'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff2' => 'font/woff2',
        'txt' => 'text/plain; charset=utf-8',
        default => 'application/octet-stream',
    };
}

function serve_spa(): void
{
    $js = null;
    $css = [];
    $manifestPath = __DIR__ . '/public/static/.vite/manifest.json';
    if (is_file($manifestPath)) {
        $manifest = json_decode((string) file_get_contents($manifestPath), true) ?: [];
        $entry = $manifest['index.html'] ?? null;
        if (is_array($entry) && isset($entry['file'])) {
            $js = '/static/' . $entry['file'];
            foreach ($entry['css'] ?? [] as $file) {
                $css[] = '/static/' . $file;
            }
        }
    }

    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    if (\Et\Core\Config::get('debug', false)) {
        header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'; frame-src 'self' data: blob:; connect-src 'self'");
    } else {
        header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: http: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'self' data: blob:; connect-src 'self'");
    }

    if ($js === null) {
        http_response_code(503);
        echo '<!doctype html><meta charset="utf-8"><title>eTemplator</title>'
            . '<p style="font-family:system-ui;padding:2rem;color:#0F2540">Frontend is not built yet. '
            . 'Run <code>npm install &amp;&amp; npm run build</code> (or use the Vite dev server during development).</p>';
        exit;
    }

    $links = implode('', array_map(fn ($href) => '<link rel="stylesheet" href="' . htmlspecialchars($href, ENT_QUOTES) . '">', $css));
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>eTemplator</title>'
        . '<link rel="icon" href="data:image/svg+xml,' . rawurlencode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%232B7FE0" stroke-width="2"><path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M4.9 19.1L19.1 4.9"/></svg>') . '">'
        . $links
        . '</head><body><div id="root"></div>'
        . '<script type="module" src="' . htmlspecialchars($js, ENT_QUOTES) . '"></script>'
        . '</body></html>';
}
