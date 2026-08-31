<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit("CLI only\n");
}

$root = dirname(__DIR__);
require $root . '/app/bootstrap.php';

use Et\Core\Config;
use Et\Core\Database;

$fresh = in_array('--fresh', $argv, true);

try {
    $pdo = Database::conn();
} catch (PDOException $e) {
    fwrite(STDERR, "DB connection failed: {$e->getMessage()}\n");
    fwrite(STDERR, "Check app/config.php or ET_DB_* environment variables.\n");
    exit(1);
}

if ($fresh) {
    if (getenv('ET_MIGRATE_ALLOW_FRESH') !== '1') {
        fwrite(STDERR, "Refusing to run --fresh without ET_MIGRATE_ALLOW_FRESH=1 (this drops all tables).\n");
        exit(1);
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach (['templates', 'template_versions', 'assets', 'components', 'settings', 'migrations'] as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `{$table}`");
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    echo "Dropped all tables.\n";
}

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(190) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4'
);

$applied = [];
foreach ($pdo->query('SELECT filename FROM migrations')->fetchAll() as $row) {
    $applied[] = (string) $row['filename'];
}

$files = glob($root . '/migrations/*.sql');
sort($files);
if ($files === false || $files === []) {
    echo "No migration files found.\n";
    exit(0);
}

$ran = 0;
foreach ($files as $file) {
    $filename = basename($file);
    if (in_array($filename, $applied, true)) {
        continue;
    }
    $sql = (string) file_get_contents($file);
    $statements = array_filter(
        array_map('trim', split_sql($sql)),
        static fn (string $s): bool => $s !== ''
    );
    try {
        foreach ($statements as $statement) {
            $pdo->exec($statement);
        }
        $stmt = $pdo->prepare('INSERT INTO migrations (filename) VALUES (?)');
        $stmt->execute([$filename]);
        echo "Applied {$filename}\n";
        $ran++;
    } catch (PDOException $e) {
        fwrite(STDERR, "Failed applying {$filename}: {$e->getMessage()}\n");
        exit(1);
    }
}

echo $ran === 0 ? "Database is up to date.\n" : "Done ({$ran} migration(s)).\n";

function split_sql(string $sql): array
{
    $lines = preg_split('/\R/u', $sql) ?: [];
    $out = [];
    $current = '';
    foreach ($lines as $line) {
        $trimmed = ltrim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '--') || str_starts_with($trimmed, '#')) {
            continue;
        }
        $current .= $line . "\n";
        if (str_ends_with(rtrim($line), ';')) {
            $out[] = rtrim(rtrim($current), ';');
            $current = '';
        }
    }
    if (trim($current) !== '') {
        $out[] = rtrim(trim($current), ';');
    }
    return $out;
}
