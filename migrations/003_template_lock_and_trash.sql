ALTER TABLE templates
    ADD COLUMN locked TINYINT(1) NOT NULL DEFAULT 0 AFTER name,
    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at,
    ADD INDEX idx_templates_deleted_at (deleted_at);
