<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

final class ExtensionsUninstallCommand extends Command
{
    protected $signature = 'extensions:uninstall {identifier : Extension identifier}';

    protected $description = 'Rollback migrations and remove extension from registry';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');

        if (! $this->confirm("This will rollback migrations and remove [{$identifier}]. Continue?")) {
            return self::SUCCESS;
        }

        try {
            $manager->uninstall($identifier);
            $this->info("Extension [{$identifier}] uninstalled.");
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
