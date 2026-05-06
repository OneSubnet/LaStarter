<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

final class ExtensionsDisableCommand extends Command
{
    protected $signature = 'extensions:disable {identifier : Extension identifier}
                               {--team= : Team ID (required for per-team disable)}';

    protected $description = 'Disable an extension for a team';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');
        $teamId = $this->option('team');

        if (! $teamId) {
            $this->error('The --team option is required.');

            return self::FAILURE;
        }

        try {
            $manager->disable($identifier, (int) $teamId);
            $this->info("Extension [{$identifier}] disabled for team [{$teamId}].");
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
