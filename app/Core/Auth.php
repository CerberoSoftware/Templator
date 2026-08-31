<?php
declare(strict_types=1);

namespace Et\Core;

final class Auth
{
    private const MAX_FAILURES = 5;
    private const LOCK_SECONDS = 60;

    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        session_name('etsid');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $secure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    /** @return array{ok: bool, message?: string} */
    public static function login(string $password): array
    {
        $now = time();
        $state = $_SESSION['rl'] ?? ['count' => 0, 'until' => 0, 'first' => 0];

        if ($state['until'] > $now) {
            $wait = $state['until'] - $now;
            return ['ok' => false, 'message' => "Too many attempts. Try again in {$wait} seconds."];
        }

        $hash = (string) Config::get('auth.password_hash', '');
        if ($hash === '' || $hash === 'REPLACE_WITH_BCRYPT_HASH') {
            return ['ok' => false, 'message' => 'Server auth is not configured (app/config.php).'];
        }

        if (password_verify($password, $hash)) {
            session_regenerate_id(true);
            $_SESSION['user'] = true;
            unset($_SESSION['rl']);
            return ['ok' => true];
        }

        if ($now - $state['first'] > 300) {
            $state = ['count' => 0, 'until' => 0, 'first' => $now];
        }
        $state['count']++;
        if ($state['count'] >= self::MAX_FAILURES) {
            $state['until'] = $now + self::LOCK_SECONDS;
            $state['count'] = 0;
            $state['first'] = $now;
        }
        $_SESSION['rl'] = $state;

        return ['ok' => false, 'message' => 'Invalid password.'];
    }

    public static function isUser(): bool
    {
        return ($_SESSION['user'] ?? false) === true;
    }

    public static function requireUser(): void
    {
        if (!self::isUser()) {
            Response::error(401, 'Authentication required', 'auth_required');
        }
    }

    public static function requireCsrf(string $method): void
    {
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return;
        }
        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $known = $_SESSION['csrf'] ?? '';
        if ($known === '' || $header === '' || !hash_equals($known, (string) $header)) {
            Response::error(403, 'CSRF token mismatch', 'csrf');
        }
    }

    public static function csrfToken(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(20));
        }
        return (string) $_SESSION['csrf'];
    }

    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => '/',
                'secure' => $secure,
                'httponly' => true,
            ]);
        }
        session_destroy();
    }
}
