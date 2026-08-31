<?php
declare(strict_types=1);

namespace Et\Controllers;

use Et\Core\Config;
use Et\Core\Request;
use Et\Core\Response;
use Et\Repos\AssetRepository;

final class AssetsController
{
    public function index(): void
    {
        Response::ok((new AssetRepository())->all());
    }

    public function upload(Request $req): void
    {
        $file = $req->file();
        if ($file === null) {
            Response::error(400, 'No file uploaded (field name must be "file")', 'no_file');
        }
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error(400, 'Upload failed with code ' . (string) $file['error'], 'upload_error');
        }

        $maxBytes = (int) Config::get('uploads.max_bytes', 2097152);
        if ((int) $file['size'] > $maxBytes) {
            Response::error(413, 'File exceeds the ' . round($maxBytes / 1048576, 1) . ' MB limit', 'too_large');
        }

        $mime = $this->detectMime((string) $file['tmp_name']);
        $allowed = Config::get('uploads.allowed_mime', []);
        if (!in_array($mime, $allowed, true)) {
            Response::error(415, 'Only PNG, JPEG, GIF and WebP images are allowed', 'bad_mime');
        }

        $ext = match ($mime) {
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'bin',
        };

        $original = (string) ($file['name'] ?? 'image');
        $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '', pathinfo($original, PATHINFO_FILENAME)) ?: 'image';
        $fileName = bin2hex(random_bytes(6)) . '-' . mb_substr($safeName, 0, 60) . '.' . $ext;

        $dir = (string) Config::get('uploads.dir');
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            Response::error(500, 'Uploads directory is not writable', 'no_dir');
        }

        $target = rtrim($dir, '/') . '/' . $fileName;
        if (!move_uploaded_file((string) $file['tmp_name'], $target)) {
            if (PHP_SAPI === 'cli-server' && !@rename((string) $file['tmp_name'], $target)) {
                Response::error(500, 'Could not store the uploaded file', 'store_failed');
            }
        }

        $url = rtrim($this->baseUrl(), '/') . '/uploads/' . $fileName;
        $repo = new AssetRepository();
        $id = $repo->create(mb_substr($original, 0, 190), $url, '/uploads/' . $fileName, $mime, (int) $file['size']);
        Response::ok($repo->find($id));
    }

    public function destroy(Request $req, array $params): void
    {
        $id = (int) $params['id'];
        $repo = new AssetRepository();
        $asset = $repo->find($id);
        if ($asset === null) {
            Response::error(404, 'Asset not found', 'not_found');
        }

        $usage = $repo->usageCount((string) $asset['url']);
        $force = strtolower((string) ($req->input('force') ?? '')) === '1'
            || strtolower((string) ($req->input('force') ?? '')) === 'true';
        if ($usage > 0 && !$force) {
            Response::error(409, "Asset is referenced by {$usage} template snapshot(s). Pass force=1 to delete anyway.", 'in_use');
        }

        $repo->delete($id);
        $file = dirname(__DIR__, 2) . '/public' . (string) $asset['path'];
        $real = realpath($file);
        if ($real !== false && str_starts_with($real, dirname(__DIR__, 2) . '/public/uploads/') && is_file($real)) {
            @unlink($real);
        }
        Response::ok();
    }

    private function detectMime(string $tmpPath): string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $tmpPath);
            finfo_close($finfo);
            if (is_string($mime) && $mime !== '') {
                return $mime;
            }
        }
        $info = @getimagesize($tmpPath);
        return is_array($info) && isset($info['mime']) ? (string) $info['mime'] : 'application/octet-stream';
    }

    private function baseUrl(): string
    {
        $configured = (string) Config::get('base_url', '');
        if ($configured !== '') {
            return rtrim($configured, '/');
        }
        $https = !empty($_SERVER['HTTP_X_FORWARDED_PROTO'])
            ? $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https'
            : (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return ($https ? 'https' : 'http') . '://' . $host;
    }
}
