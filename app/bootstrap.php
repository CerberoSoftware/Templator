<?php
declare(strict_types=1);

spl_autoload_register(static function (string $class): void {
    $prefix = 'Et\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $file = __DIR__ . '/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => ['message' => 'app/config.php is missing. Copy app/config.example.php to app/config.php and configure it.']]);
    exit;
}

$config = require $configFile;

Et\Core\Config::init(is_array($config) ? $config : [], $configFile);

set_exception_handler(static function (Throwable $e): void {
    error_log('[etemplator] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    $debug = Et\Core\Config::get('debug', false);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => ['message' => $debug ? $e->getMessage() : 'Internal server error']]);
    exit;
});
