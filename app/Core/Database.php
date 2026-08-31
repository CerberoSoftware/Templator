<?php
declare(strict_types=1);

namespace Et\Core;

final class Database
{
    private static ?\PDO $conn = null;

    public static function conn(): \PDO
    {
        if (self::$conn === null) {
            $db = Config::get('db');
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $db['host'],
                $db['port'],
                $db['name'],
                $db['charset'] ?? 'utf8mb4'
            );
            self::$conn = new \PDO($dsn, $db['user'], $db['pass'], [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        }
        return self::$conn;
    }
}
