<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

class ExtensionsListCommand extends Command
{
    protected $signature = 'extensions:list {--type= : Filter by type (module, theme)}';

    protected $description = 'List all registered extensions';

    public function handle(ExtensionManager $manager): int
    {
        $extensions = $manager->all();
        $typeFilter = $this->option('type');

        if ($typeFilter) {
            $extensions = $extensions->filter(fn ($e) => $e->type === $typeFilter);
        }

        if ($extensions->isEmpty()) {
            $this->info('No extensions found. Run extensions:scan to discover extensions.');

            return self::SUCCESS;
        }

        $this->table(
            ['Identifier', 'Name', 'Type', 'Version', 'State'],
            $extensions->map(fn ($e) => [
                $e->identifier,
                $e->name,
                $e->type,
                $e->version,
                $e->state,
            ])->toArray()
        );

        return self::SUCCESS;
    }
}
