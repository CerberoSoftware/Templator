<?php
declare(strict_types=1);

namespace Et\Controllers;

use Et\Core\Request;
use Et\Core\Response;
use Et\Repos\SettingsRepository;

final class SettingsController
{
    public function index(): void
    {
        Response::ok((new SettingsRepository())->all());
    }

    public function update(Request $req): void
    {
        $values = $req->input('settings');
        if (!is_array($values)) {
            Response::error(400, 'settings object is required', 'invalid');
        }
        (new SettingsRepository())->save($values);
        Response::ok((new SettingsRepository())->all());
    }
}
