<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

class ExtensionsDisableCommand extends Command
{
    protected $signature = 'extensions:disable {identifier : The extension identifier} {--team= : Disable for a specific team ID}';

    protected $description = 'Disable an extension globally or for a specific team';

    public function handle(ExtensionManager $manager): int
    {
        $identifier = $this->argument('identifier');
        $teamId = $this->option('team');

        try {
            $manager->disable($identifier, $teamId ? (int) $teamId : null);
        } catch (\InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($teamId) {
            $this->info("Extension '{$identifier}' disabled for team {$teamId}.");
        } else {
            $this->info("Extension '{$identifier}' disabled globally.");
        }

        return self::SUCCESS;
    }
}
