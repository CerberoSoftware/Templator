<?php
declare(strict_types=1);

namespace Et\Repos;

use Et\Core\Database;

final class VersionRepository
{
    private const KEEP = 50;

    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::conn();
    }

    /** @return array<int, array<string, mixed>> */
    public function listFor(int $templateId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, label, created_at, LENGTH(json_structure) AS json_bytes, LENGTH(final_html) AS html_bytes
             FROM template_versions WHERE template_id = ? ORDER BY created_at DESC, id DESC LIMIT 200'
        );
        $stmt->execute([$templateId]);
        return $stmt->fetchAll();
    }

    public function snapshot(int $templateId, string $jsonStructure, string $finalHtml, ?string $label): int
    {
        $stmt = $this->db->prepare('INSERT INTO template_versions (template_id, label, json_structure, final_html) VALUES (?, ?, ?, ?)');
        $stmt->execute([$templateId, $label, $jsonStructure, $finalHtml]);
        $id = (int) $this->db->lastInsertId();
        $this->prune($templateId);
        return $id;
    }

    /** @return array<string, mixed>|null */
    public function find(int $templateId, int $versionId): ?array
    {
        $stmt = $this->db->prepare('SELECT id, template_id, label, json_structure, final_html, created_at FROM template_versions WHERE id = ? AND template_id = ?');
        $stmt->execute([$versionId, $templateId]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    private function prune(int $templateId): void
    {
        $stmt = $this->db->prepare(
            'DELETE FROM template_versions WHERE template_id = ? AND id NOT IN (
                 SELECT id FROM (
                     SELECT id FROM template_versions WHERE template_id = ? ORDER BY created_at DESC, id DESC LIMIT ' . self::KEEP . '
                 ) keep
             )'
        );
        $stmt->execute([$templateId, $templateId]);
    }
}
