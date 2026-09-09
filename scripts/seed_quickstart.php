<?php
declare(strict_types=1);

/**
 * Seeds the quickstart_templates table from the original MySQL migration file.
 * Fixes MySQL backslash escaping for SQLite (\\ → \) so JSON unicode escapes
 * and newlines survive the round-trip correctly.
 */

$root = dirname(__DIR__);
$sqlFile = $root . '/migrations/004_quickstart_templates.sql';
if (!is_file($sqlFile)) {
    fwrite(STDERR, "Migration file not found: {$sqlFile}\n");
    return;
}

$sql = (string) file_get_contents($sqlFile);
$lines = preg_split('/\R/u', $sql) ?: [];

$pdo = \Et\Core\Database::conn();

foreach ($lines as $line) {
    $trimmed = ltrim($line);
    if (!str_starts_with($trimmed, 'INSERT INTO quickstart_templates')) {
        continue;
    }
    // MySQL uses \\ for an escaped backslash; SQLite treats backslash literally.
    // Replace \\ with \ so JSON unicode escapes (\\u00a9 → \u00a9) and
    // newlines (\\n → \n) are stored correctly.
    $sqlite = str_replace('\\\\', '\\', $trimmed);
    $pdo->exec($sqlite);
}
