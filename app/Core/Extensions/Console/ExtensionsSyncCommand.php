<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

final class ExtensionsSyncCommand extends Command
{
    protected $signature = 'extensions:sync';

    protected $description = 'Sync extensions from filesystem to database and seed permissions';

    public function handle(ExtensionManager $manager): int
    {
        $manager->sync();

        $this->info('Extensions synced and permissions seeded.');

        return self::SUCCESS;
    }
}
