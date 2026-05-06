<?php

namespace App\Core\System\Console;

use App\Core\System\CoreUpdater;
use Illuminate\Console\Command;

final class CoreUpdateCommand extends Command
{
    protected $signature = 'core:update
        {--check : Only check for updates, do not install}
        {--force : Force update even with warnings}
        {--no-backup : Skip backup creation}';

    protected $description = 'Update the LaStarter core platform';

    public function handle(CoreUpdater $updater): int
    {
        $version = $updater->checkForUpdate();

        if ($this->option('check')) {
            if ($version->isUpToDate()) {
                $this->info("Already up to date (v{$version->current}).");

                return self::SUCCESS;
            }

            $this->info("Update available: v{$version->current} → v{$version->latest}");

            if ($version->changelog) {
                $this->newLine();
                $this->line($version->changelog);
            }

            return self::SUCCESS;
        }

        if ($version->isUpToDate()) {
            $this->info("Already up to date (v{$version->current}).");

            return self::SUCCESS;
        }

        $this->info("Updating from v{$version->current} to v{$version->latest}...");

        if (! $this->option('force') && ! $this->confirm('Proceed with update?', true)) {
            $this->info('Update cancelled.');

            return self::SUCCESS;
        }

        $result = $updater->update(
            force: $this->option('force'),
            skipBackup: $this->option('no-backup'),
        );

        if ($result->success) {
            $this->info("Core updated to v{$result->toVersion}!");

            if ($result->backupPath) {
                $this->line("Backup: {$result->backupPath}");
            }

            return self::SUCCESS;
        }

        foreach ($result->errors as $error) {
            $this->error($error);
        }

        return self::FAILURE;
    }
}
