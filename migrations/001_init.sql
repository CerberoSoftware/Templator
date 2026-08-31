CREATE TABLE IF NOT EXISTS templates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    json_structure LONGTEXT NULL,
    final_html LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS template_versions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_id INT UNSIGNED NOT NULL,
    label VARCHAR(190) NULL,
    json_structure LONGTEXT NULL,
    final_html LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tv_template FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE,
    INDEX idx_tv_template (template_id, created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    url VARCHAR(500) NOT NULL,
    path VARCHAR(300) NOT NULL,
    mime VARCHAR(100) NOT NULL,
    size INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS components (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(190) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Custom',
    html_template LONGTEXT NOT NULL,
    props_schema LONGTEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` LONGTEXT NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO settings (`key`, `value`) VALUES ('brand_fonts', '[
  {"name": "Arial", "stack": "Arial, Helvetica, sans-serif"},
  {"name": "Helvetica", "stack": "Helvetica, Arial, sans-serif"},
  {"name": "Georgia", "stack": "Georgia, serif"},
  {"name": "Times New Roman", "stack": "\'Times New Roman\', Times, serif"},
  {"name": "Trebuchet MS", "stack": "\'Trebuchet MS\', Tahoma, sans-serif"},
  {"name": "Verdana", "stack": "Verdana, Geneva, sans-serif"},
  {"name": "Tahoma", "stack": "Tahoma, Verdana, sans-serif"},
  {"name": "Courier New", "stack": "\'Courier New\', Courier, monospace"}
]') ON DUPLICATE KEY UPDATE `value` = `value`;
