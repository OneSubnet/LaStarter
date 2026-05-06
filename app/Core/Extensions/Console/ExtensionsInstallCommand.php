<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

final class ExtensionsInstallCommand extends Command
{
    protected $signature = 'extensions:install {identifier : Extension identifier}
                              {--team= : Team ID to install for}';

    protected $description = 'Install an extension (run migrations)';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');

        try {
            $manager->install($identifier);
            $this->info("Extension [{$identifier}] installed.");

            $teamId = $this->option('team');

            if ($teamId) {
                $manager->enable($identifier, (int) $teamId);
                $this->info("Extension [{$identifier}] enabled for team [{$teamId}].");
            }
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
