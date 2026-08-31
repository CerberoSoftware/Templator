<?php
declare(strict_types=1);

namespace Et\Repos;

use Et\Core\Database;

final class AssetRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::conn();
    }

    /** @return array<int, array<string, mixed>> */
    public function all(): array
    {
        return $this->db->query('SELECT id, name, url, path, mime, size, created_at FROM assets ORDER BY created_at DESC, id DESC')->fetchAll();
    }

    public function create(string $name, string $url, string $path, string $mime, int $size): int
    {
        $stmt = $this->db->prepare('INSERT INTO assets (name, url, path, mime, size) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$name, $url, $path, $mime, $size]);
        return (int) $this->db->lastInsertId();
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, name, url, path, mime, size, created_at FROM assets WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM assets WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function usageCount(string $url): int
    {
        $stmt = $this->db->prepare(
            'SELECT (
                (SELECT COUNT(*) FROM templates WHERE json_structure LIKE ? OR final_html LIKE ?)
              + (SELECT COUNT(*) FROM template_versions WHERE json_structure LIKE ? OR final_html LIKE ?)
            ) AS c'
        );
        $needle = '%' . $url . '%';
        $stmt->execute([$needle, $needle, $needle, $needle]);
        return (int) ($stmt->fetch()['c'] ?? 0);
    }
}
