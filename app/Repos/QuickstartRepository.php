<?php
declare(strict_types=1);

namespace Et\Repos;

use Et\Core\Database;

final class QuickstartRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::conn();
    }

    /** @return array<int, array<string, mixed>> */
    public function all(): array
    {
        return $this->db->query(
            'SELECT id, name, description, category, json_structure, locked, created_at
             FROM quickstart_templates
             ORDER BY category, name'
        )->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, name, description, category, json_structure, locked, created_at FROM quickstart_templates WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function create(string $name, string $description, string $category, string $jsonStructure, bool $locked): int
    {
        $stmt = $this->db->prepare('INSERT INTO quickstart_templates (name, description, category, json_structure, locked) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$name, $description, $category, $jsonStructure, $locked ? 1 : 0]);
        return (int) $this->db->lastInsertId();
    }

    public function setLocked(int $id, bool $locked): void
    {
        $stmt = $this->db->prepare('UPDATE quickstart_templates SET locked = ? WHERE id = ?');
        $stmt->execute([$locked ? 1 : 0, $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM quickstart_templates WHERE id = ?');
        $stmt->execute([$id]);
    }
}
