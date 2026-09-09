<?php
declare(strict_types=1);

namespace Et\Core;

final class Database
{
    private static ?\PDO $conn = null;

    public static function conn(): \PDO
    {
        if (self::$conn === null) {
            $path = (string) Config::get('db.path', __DIR__ . '/../../database.sqlite');
            $dir = dirname($path);
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                throw new \RuntimeException("Cannot create database directory: {$dir}");
            }
            self::$conn = new \PDO('sqlite:' . $path, null, null, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            self::$conn->exec('PRAGMA foreign_keys = ON');
            self::$conn->exec('PRAGMA journal_mode = WAL');
        }
        return self::$conn;
    }
}
