<?php

namespace App\Core\Extensions\Marketplace;

final readonly class UpdateInfo
{
    public function __construct(
        public string $identifier,
        public string $currentVersion,
        public string $latestVersion,
        public string $owner,
        public string $repo,
    ) {}
}
