<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

class ExtensionsInstallCommand extends Command
{
    protected $signature = 'extensions:install {identifier : The extension identifier}';

    protected $description = 'Install an extension (run migrations, set state to disabled)';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');

        if (! $manager->get($identifier)) {
            $this->error("Extension [{$identifier}] not found. Run extensions:scan first.");

            return self::FAILURE;
        }

        $extension = $manager->get($identifier);

        if ($extension->state !== 'not_installed') {
            $this->warn("Extension [{$identifier}] is already installed (state: {$extension->state}).");

            return self::SUCCESS;
        }

        $manager->install($identifier);

        $this->info("Extension [{$identifier}] installed successfully.");
        $this->line('State: disabled (run extensions:enable to activate)');

        return self::SUCCESS;
    }
}
