<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

class ExtensionsUninstallCommand extends Command
{
    protected $signature = 'extensions:uninstall {identifier : The extension identifier}
                            {--force : Force uninstall even if enabled}';

    protected $description = 'Uninstall an extension (rollback migrations, remove from registry)';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');

        if (! $manager->get($identifier)) {
            $this->error("Extension [{$identifier}] not found.");

            return self::FAILURE;
        }

        $extension = $manager->get($identifier);

        if (! $this->option('force') && $extension->state === 'enabled') {
            $this->error("Extension [{$identifier}] is currently enabled. Disable it first or use --force.");

            return self::FAILURE;
        }

        if (! $this->confirm("Are you sure you want to uninstall [{$identifier}]? This will rollback migrations and remove data.")) {
            return self::SUCCESS;
        }

        $manager->uninstall($identifier);

        $this->info("Extension [{$identifier}] uninstalled successfully.");

        return self::SUCCESS;
    }
}
