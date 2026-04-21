<?php

return [

    'path' => base_path('extensions'),

    'types' => ['module', 'theme', 'language'],

    'marketplace_url' => env('MARKETPLACE_URL', 'https://marketplace.lastarter.com'),

    'github_org' => env('GITHUB_ORG', 'OneSubnet'),

    'marketplace_repo' => env('MARKETPLACE_REPO', 'LaStarter-Marketplace'),

    'github_token' => env('GITHUB_TOKEN'),

    'max_upload_size' => 50 * 1024 * 1024, // 50MB

    'temp_path' => storage_path('app/extensions-temp'),

];
