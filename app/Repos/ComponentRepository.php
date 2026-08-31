<?php
declare(strict_types=1);

namespace Et\Repos;

use Et\Core\Database;

final class ComponentRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::conn();
    }

    /** @return array<int, array<string, mixed>> */
    public function all(): array
    {
        return $this->db->query('SELECT id, name, category, html_template, props_schema, created_at FROM components ORDER BY category, name')->fetchAll();
    }

    public function create(string $name, string $category, string $htmlTemplate, ?string $propsSchema): int
    {
        $stmt = $this->db->prepare('INSERT INTO components (name, category, html_template, props_schema) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $category, $htmlTemplate, $propsSchema]);
        return (int) $this->db->lastInsertId();
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM components WHERE id = ?');
        $stmt->execute([$id]);
    }
}
