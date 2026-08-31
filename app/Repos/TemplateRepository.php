<?php
declare(strict_types=1);

namespace Et\Repos;

use Et\Core\Database;

final class TemplateRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::conn();
    }

    /** @return array<int, array<string, mixed>> */
    public function all(): array
    {
        $sql = "SELECT t.id, t.name, t.created_at, t.updated_at,
                    (SELECT COUNT(*) FROM template_versions v WHERE v.template_id = t.id) AS version_count
                FROM templates t
                ORDER BY t.updated_at DESC, t.id DESC";
        return $this->db->query($sql)->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, name, json_structure, final_html, created_at, updated_at FROM templates WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public function create(string $name, ?string $jsonStructure, ?string $finalHtml): int
    {
        $stmt = $this->db->prepare('INSERT INTO templates (name, json_structure, final_html) VALUES (?, ?, ?)');
        $stmt->execute([$name, $jsonStructure, $finalHtml]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, string $name, string $jsonStructure, string $finalHtml): void
    {
        $stmt = $this->db->prepare('UPDATE templates SET name = ?, json_structure = ?, final_html = ? WHERE id = ?');
        $stmt->execute([$name, $jsonStructure, $finalHtml, $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM templates WHERE id = ?');
        $stmt->execute([$id]);
    }
}
