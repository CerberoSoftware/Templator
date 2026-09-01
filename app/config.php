<?php
return [
    'db' => [
        'host' => getenv('ET_DB_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('ET_DB_PORT') ?: '3306'),
        'name' => getenv('ET_DB_NAME') ?: 'etemplator',
        'user' => getenv('ET_DB_USER') ?: 'etemplator',
        'pass' => getenv('ET_DB_PASS') ?: '',
        'charset' => 'utf8mb4',
    ],
    'auth' => [
        'password_hash' => getenv('ET_PASSWORD_HASH') ?: '$2y$10$KN3FZdSOp7Bw2EdwICqvq.7Qrhfw9tmK054257zJHUdpYgapJziLO',
    ],
    'uploads' => [
        'dir' => __DIR__ . '/../public/uploads',
        'max_bytes' => 2 * 1024 * 1024,
        'allowed_mime' => ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    ],
    'base_url' => getenv('ET_BASE_URL') ?: '',
    'debug' => false,
];
