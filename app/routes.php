<?php
declare(strict_types=1);

use Et\Controllers\AssetsController;
use Et\Controllers\AuthController;
use Et\Controllers\ComponentsController;
use Et\Controllers\SettingsController;
use Et\Controllers\TemplatesController;

$auth = new AuthController();
$templates = new TemplatesController();
$assets = new AssetsController();
$components = new ComponentsController();
$settings = new SettingsController();

$router->add('GET', '/api/health', static function (): void {
    \Et\Core\Response::ok(['status' => 'ok', 'time' => date('c')]);
}, true);

$router->add('POST', '/api/auth/login', [$auth, 'login'], true);
$router->add('GET', '/api/auth/me', [$auth, 'me']);
$router->add('POST', '/api/auth/logout', [$auth, 'logout']);

$router->add('GET', '/api/templates', [$templates, 'index']);
$router->add('POST', '/api/templates', [$templates, 'store']);
$router->add('GET', '/api/templates/:id', [$templates, 'show']);
$router->add('PUT', '/api/templates/:id', [$templates, 'update']);
$router->add('DELETE', '/api/templates/:id', [$templates, 'destroy']);

$router->add('GET', '/api/templates/:id/versions', [$templates, 'versions']);
$router->add('GET', '/api/templates/:id/versions/:version', [$templates, 'version']);
$router->add('POST', '/api/templates/:id/versions', [$templates, 'snapshot']);
$router->add('POST', '/api/templates/:id/versions/:version/restore', [$templates, 'restore']);

$router->add('GET', '/api/assets', [$assets, 'index']);
$router->add('POST', '/api/assets', [$assets, 'upload']);
$router->add('DELETE', '/api/assets/:id', [$assets, 'destroy']);

$router->add('GET', '/api/components', [$components, 'index']);
$router->add('POST', '/api/components', [$components, 'store']);
$router->add('DELETE', '/api/components/:id', [$components, 'destroy']);

$router->add('GET', '/api/settings', [$settings, 'index']);
$router->add('PUT', '/api/settings', [$settings, 'update']);
