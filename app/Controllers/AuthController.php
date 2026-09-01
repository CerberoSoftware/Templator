<?php
declare(strict_types=1);

namespace Et\Controllers;

use Et\Core\Auth;
use Et\Core\Request;
use Et\Core\Response;

final class AuthController
{
    public function login(Request $req): void
    {
        $password = $req->string('password');
        if ($password === '') {
            Response::error(400, 'Password is required', 'password_required');
        }
        $result = Auth::login($password);
        if (!$result['ok']) {
            Response::error(401, $result['message'] ?? 'Invalid password', 'bad_credentials');
        }
        Response::ok(['user' => ['name' => 'admin'], 'csrf' => Auth::csrfToken()]);
    }

    public function me(): void
    {
        Response::ok(['user' => ['name' => 'admin'], 'csrf' => Auth::csrfToken()]);
    }

    public function logout(): void
    {
        Auth::logout();
        Response::ok();
    }

    public function changePassword(Request $req): void
    {
        $current = $req->string('current_password');
        $new     = $req->string('new_password');
        if (strlen($new) < 8) {
            Response::error(422, 'Password must be at least 8 characters.', 'password_too_short');
            return;
        }
        $result = Auth::login($current);
        if (!$result['ok']) {
            Response::error(403, 'Current password is incorrect.', 'bad_credentials');
            return;
        }
        Auth::setPassword($new);
        Response::ok();
    }
}
