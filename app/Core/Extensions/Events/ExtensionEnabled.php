<?php

namespace App\Core\Extensions\Events;

use App\Core\Extensions\ExtensionManifest;
use App\Models\Extension;

final readonly class ExtensionEnabled
{
    public function __construct(
        public Extension $extension,
        public ExtensionManifest $manifest,
        public int $teamId,
    ) {}
}
