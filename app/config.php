<?php
return [
    'db' => [
        'path' => getenv('ET_DB_PATH') ?: __DIR__ . '/../database.sqlite',
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
