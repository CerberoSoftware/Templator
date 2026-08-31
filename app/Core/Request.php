<?php
declare(strict_types=1);

namespace Et\Core;

final class Request
{
    public string $method;
    public string $path;
    /** @var array<string, mixed> */
    public array $query;

    private ?array $bodyCache = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $this->path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $this->query = $_GET;
    }

    /** @return array<string, mixed> */
    public function body(): array
    {
        if ($this->bodyCache === null) {
            $raw = file_get_contents('php://input') ?: '';
            $parsed = json_decode($raw, true);
            $this->bodyCache = is_array($parsed) ? $parsed : [];
        }
        return $this->bodyCache;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        $body = $this->body();
        if (array_key_exists($key, $body)) {
            return $body[$key];
        }
        return $this->query[$key] ?? $default;
    }

    public function string(string $key, string $default = ''): string
    {
        $value = $this->input($key, $default);
        return is_string($value) ? trim($value) : $default;
    }

    public function int(string $key, int $default = 0): int
    {
        $value = $this->input($key, $default);
        return is_numeric($value) ? (int) $value : $default;
    }

    /** @return array<string, mixed>|null */
    public function file(): ?array
    {
        return $_FILES['file'] ?? null;
    }
}
