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

    public const TRASH_RETENTION_DAYS = 30;

    /** @return array<int, array<string, mixed>> */
    public function all(): array
    {
        $sql = "SELECT t.id, t.name, t.locked, t.created_at, t.updated_at,
                    (SELECT COUNT(*) FROM template_versions v WHERE v.template_id = t.id) AS version_count
                FROM templates t
                WHERE t.deleted_at IS NULL
                ORDER BY t.updated_at DESC, t.id DESC";
        return $this->db->query($sql)->fetchAll();
    }

    /** @return array<int, array<string, mixed>> */
    public function trashed(): array
    {
        $this->purgeExpired();
        $sql = "SELECT t.id, t.name, t.locked, t.created_at, t.updated_at, t.deleted_at,
                    (SELECT COUNT(*) FROM template_versions v WHERE v.template_id = t.id) AS version_count
                FROM templates t
                WHERE t.deleted_at IS NOT NULL
                ORDER BY t.deleted_at DESC, t.id DESC";
        return $this->db->query($sql)->fetchAll();
    }

    /** @return array<string, mixed>|null */
    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, name, locked, json_structure, final_html, created_at, updated_at, deleted_at FROM templates WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** @return array<string, mixed>|null */
    public function findTrashed(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, name, locked, json_structure, final_html, created_at, updated_at, deleted_at FROM templates WHERE id = ? AND deleted_at IS NOT NULL');
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

    public function setLocked(int $id, bool $locked): void
    {
        $stmt = $this->db->prepare('UPDATE templates SET locked = ? WHERE id = ?');
        $stmt->execute([$locked ? 1 : 0, $id]);
    }

    public function softDelete(int $id): void
    {
        $stmt = $this->db->prepare('UPDATE templates SET deleted_at = datetime(\'now\') WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function restore(int $id): void
    {
        $stmt = $this->db->prepare('UPDATE templates SET deleted_at = NULL WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM templates WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function purgeExpired(): void
    {
        $stmt = $this->db->prepare('DELETE FROM templates WHERE deleted_at IS NOT NULL AND deleted_at < datetime(\'now\', \'-' . self::TRASH_RETENTION_DAYS . ' days\')');
        $stmt->execute();
    }
}
