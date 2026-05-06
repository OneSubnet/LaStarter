<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\Updater\UpdateService;
use Illuminate\Console\Command;

final class ExtensionsCheckUpdatesCommand extends Command
{
    protected $signature = 'extensions:check-updates';

    protected $description = 'Check for available extension updates';

    public function handle(UpdateService $updateService): int
    {
        $updates = $updateService->checkForUpdates();

        if ($updates->isEmpty()) {
            $this->info('All extensions are up to date.');

            return self::SUCCESS;
        }

        foreach ($updates as $update) {
            $this->line("  <info>{$update->identifier}</info>: {$update->currentVersion} → <comment>{$update->latestVersion}</comment>");
        }

        $this->info("\nRun `php artisan extensions:update` to update all.");

        return self::SUCCESS;
    }
}
