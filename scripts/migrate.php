<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit("CLI only\n");
}

$root = dirname(__DIR__);
require $root . '/app/bootstrap.php';

use Et\Core\Database;

try {
    $pdo = Database::conn();
} catch (PDOException $e) {
    fwrite(STDERR, "DB connection failed: {$e->getMessage()}\n");
    exit(1);
}

$fresh = in_array('--fresh', $argv, true);
if ($fresh && getenv('ET_MIGRATE_ALLOW_FRESH') !== '1') {
    fwrite(STDERR, "Refusing to run --fresh without ET_MIGRATE_ALLOW_FRESH=1 (this drops all tables).\n");
    exit(1);
}

if ($fresh) {
    $pdo->exec('PRAGMA foreign_keys = OFF');
    foreach (['templates', 'template_versions', 'assets', 'components', 'settings', 'quickstart_templates'] as $table) {
        $pdo->exec("DROP TABLE IF EXISTS {$table}");
    }
    $pdo->exec('PRAGMA foreign_keys = ON');
    echo "Dropped all tables.\n";
}

// ── Schema ──────────────────────────────────────────────────────────────────

$pdo->exec('CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    locked INTEGER NOT NULL DEFAULT 0,
    json_structure TEXT,
    final_html TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
)');

$pdo->exec('CREATE INDEX IF NOT EXISTS idx_templates_deleted_at ON templates (deleted_at)');

$pdo->exec('CREATE TRIGGER IF NOT EXISTS templates_updated_at
    AFTER UPDATE ON templates
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;');

$pdo->exec('CREATE TABLE IF NOT EXISTS template_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    label TEXT,
    json_structure TEXT,
    final_html TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
)');

$pdo->exec('CREATE INDEX IF NOT EXISTS idx_tv_template ON template_versions (template_id, created_at)');

$pdo->exec('CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)');

$pdo->exec("CREATE TABLE IF NOT EXISTS components (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Custom',
    html_template TEXT NOT NULL,
    props_schema TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

$pdo->exec('CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
)');

$pdo->exec("CREATE TABLE IF NOT EXISTS quickstart_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Custom',
    json_structure TEXT NOT NULL,
    locked INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)");

// ── Seed settings ────────────────────────────────────────────────────────────

$pdo->exec("INSERT OR IGNORE INTO settings (key, value) VALUES ('brand_fonts', '[]')");

// ── Seed quickstart templates ────────────────────────────────────────────────

$count = (int) $pdo->query('SELECT COUNT(*) FROM quickstart_templates')->fetchColumn();
if ($count === 0) {
    require $root . '/scripts/seed_quickstart.php';
    echo "Seeded quickstart templates.\n";
} else {
    echo "Quickstart templates already seeded.\n";
}

echo "Database is ready.\n";
