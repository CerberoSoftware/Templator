<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli' || !isset($argv[1])) {
    exit("Usage: php scripts/hash.php <password>\n");
}

echo password_hash($argv[1], PASSWORD_BCRYPT), "\n";
