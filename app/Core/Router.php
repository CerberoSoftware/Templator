<?php
declare(strict_types=1);

namespace Et\Core;

final class Router
{
    /** @var array<int, array{method: string, regex: string, params: string[], handler: callable, public: bool}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler, bool $public = false): void
    {
        $params = [];
        $regex = preg_replace_callback(
            '/:(\w+)/',
            static function (array $m) use (&$params): string {
                $params[] = $m[1];
                return '([^/]+)';
            },
            $pattern
        );
        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => '#^' . $regex . '$#',
            'params' => $params,
            'handler' => $handler,
            'public' => $public,
        ];
    }

    public function dispatch(): void
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        if (!str_starts_with($path, '/api/')) {
            serve_spa();
            return;
        }

        Auth::start();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $this->currentMethod()) {
                continue;
            }
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }
            if (!$route['public']) {
                Auth::requireUser();
                Auth::requireCsrf($this->currentMethod());
            }
            array_shift($matches);
            $params = $route['params'] !== [] ? array_combine($route['params'], $matches) : [];
            ($route['handler'])(new Request(), $params);
            return;
        }

        Response::error(404, 'Not found', 'not_found');
    }

    private function currentMethod(): string
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($method === 'HEAD') {
            return 'GET';
        }
        return $method;
    }
}
