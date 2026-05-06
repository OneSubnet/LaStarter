<?php

return [
    'path' => base_path('extensions'),

    'github_org' => env('MARKETPLACE_GITHUB_ORG', 'OneSubnet'),
    'marketplace_repo' => env('MARKETPLACE_REPO', 'LaStarter-Marketplace'),
    'github_token' => env('MARKETPLACE_GITHUB_TOKEN'),

    'max_upload_size' => 50 * 1024 * 1024, // 50 MB
];
