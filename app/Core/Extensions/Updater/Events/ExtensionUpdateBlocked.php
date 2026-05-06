<?php

namespace App\Core\Extensions\Updater\Events;

use App\Core\System\CompatibilityReport;

final readonly class ExtensionUpdateBlocked
{
    public function __construct(
        public string $identifier,
        public CompatibilityReport $report,
    ) {}
}
