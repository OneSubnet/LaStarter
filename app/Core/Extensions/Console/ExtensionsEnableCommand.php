<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

final class ExtensionsEnableCommand extends Command
{
    protected $signature = 'extensions:enable {identifier : Extension identifier}
                              {--team= : Team ID (required for per-team enable)}';

    protected $description = 'Enable an extension for a team';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');
        $teamId = $this->option('team');

        if (! $teamId) {
            $this->error('The --team option is required.');

            return self::FAILURE;
        }

        try {
            $manager->enable($identifier, (int) $teamId);
            $this->info("Extension [{$identifier}] enabled for team [{$teamId}].");
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
