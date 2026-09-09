<?php
declare(strict_types=1);

namespace Et\Repos;

use Et\Core\Database;

final class SettingsRepository
{
    private const ALLOWED_KEYS = ['brand_fonts', 'brand_colours', 'brand_colors'];

    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::conn();
    }

    /** @return array<string, mixed> */
    public function all(): array
    {
        $rows = $this->db->query('SELECT `key`, `value` FROM settings')->fetchAll();
        $out = [];
        foreach ($rows as $row) {
            $decoded = json_decode((string) $row['value'], true);
            $out[(string) $row['key']] = $decoded === null ? $row['value'] : $decoded;
        }
        return $out;
    }

    /** @param array<string, mixed> $values */
    public function save(array $values): void
    {
        $stmt = $this->db->prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
        foreach ($values as $key => $value) {
            if (!in_array((string) $key, self::ALLOWED_KEYS, true)) {
                continue;
            }
            $stmt->execute([(string) $key, json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)]);
        }
    }
}
