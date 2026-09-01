<?php
declare(strict_types=1);

namespace Et\Core;

final class Config
{
    private static array $data = [];
    private static string $path = '';

    public static function init(array $data, string $path = ''): void
    {
        self::$data = $data;
        self::$path = $path;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = self::$data;
        foreach (explode('.', $key) as $part) {
            if (!is_array($value) || !array_key_exists($part, $value)) {
                return $default;
            }
            $value = $value[$part];
        }
        return $value;
    }

    public static function set(string $key, mixed $value): void
    {
        $parts = explode('.', $key);
        $node  = &self::$data;
        foreach ($parts as $part) {
            if (!is_array($node)) {
                $node = [];
            }
            if (!array_key_exists($part, $node)) {
                $node[$part] = [];
            }
            $node = &$node[$part];
        }
        $node = $value;
    }

    public static function persist(?string $path = null): void
    {
        $target = $path ?? self::$path;
        if ($target === '') {
            throw new \RuntimeException('Config::persist() called with no path.');
        }
        $export = var_export(self::$data, true);
        file_put_contents(
            $target,
            "<?php\ndeclare(strict_types=1);\nreturn {$export};\n",
            LOCK_EX
        );
    }
}
