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
}
