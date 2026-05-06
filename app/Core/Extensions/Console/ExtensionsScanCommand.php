<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

final class ExtensionsScanCommand extends Command
{
    protected $signature = 'extensions:scan';

    protected $description = 'Scan /extensions/ for extension.json manifests and register in database';

    public function handle(ExtensionManager $manager): int
    {
        $manifests = $manager->manifests();

        if ($manifests->isEmpty()) {
            $this->warn('No extensions found.');

            return self::SUCCESS;
        }

        foreach ($manifests as $manifest) {
            $this->line("  <info>{$manifest->identifier}</info> ({$manifest->type}) — {$manifest->name}");
        }

        $this->info("Found {$manifests->count()} extension(s).");

        return self::SUCCESS;
    }
}
