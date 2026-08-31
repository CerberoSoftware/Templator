<?php
declare(strict_types=1);

namespace Et\Core;

final class Response
{
    public static function json(int $status, mixed $data): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function ok(mixed $data = null): never
    {
        self::json(200, ['ok' => true, 'data' => $data]);
    }

    public static function error(int $status, string $message, string $code = ''): never
    {
        self::json($status, ['ok' => false, 'error' => ['message' => $message, 'code' => $code]]);
    }
}
