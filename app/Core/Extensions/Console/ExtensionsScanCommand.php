<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

class ExtensionsScanCommand extends Command
{
    protected $signature = 'extensions:scan';

    protected $description = 'Scan the /extensions directory and sync extension manifests to the database';

    public function handle(ExtensionManager $manager): int
    {
        $result = $manager->sync();

        $this->info('Extensions scanned successfully.');
        $this->line("  Created: {$result['created']}");
        $this->line("  Updated: {$result['updated']}");
        $this->line("  Removed: {$result['removed']}");

        return self::SUCCESS;
    }
}
