<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

class ExtensionsEnableCommand extends Command
{
    protected $signature = 'extensions:enable {identifier : The extension identifier} {--team= : Enable for a specific team ID}';

    protected $description = 'Enable an extension globally or for a specific team';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');
        $teamId = $this->option('team');

        try {
            $manager->enable($identifier, $teamId ? (int) $teamId : null);
        } catch (\InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($teamId) {
            $this->info("Extension '{$identifier}' enabled for team {$teamId}.");
        } else {
            $this->info("Extension '{$identifier}' enabled globally.");
        }

        return self::SUCCESS;
    }
}
