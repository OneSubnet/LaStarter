<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\Updater\UpdateService;
use Illuminate\Console\Command;

final class ExtensionsUpdateCommand extends Command
{
    protected $signature = 'extensions:update {identifier? : Specific extension to update}';

    protected $description = 'Update extensions to their latest version';

    public function handle(UpdateService $updateService): int
    {
        $identifier = $this->argument('identifier');

        if ($identifier) {
            $this->info("Updating {$identifier}...");

            if ($updateService->update($identifier)) {
                $this->info("Extension [{$identifier}] updated successfully.");

                return self::SUCCESS;
            }

            $this->error("Failed to update [{$identifier}].");

            return self::FAILURE;
        }

        $updated = $updateService->updateAll();

        if (empty($updated)) {
            $this->info('No updates available.');

            return self::SUCCESS;
        }

        foreach ($updated as $id) {
            $this->line("  <info>{$id}</info> updated.");
        }

        $this->info("\nUpdated ".count($updated).' extension(s).');

        return self::SUCCESS;
    }
}
