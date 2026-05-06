<?php

namespace App\Core\Extensions\Console;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;

final class ExtensionsListCommand extends Command
{
    protected $signature = 'extensions:list';

    protected $description = 'List all registered extensions';

    public function handle(ExtensionManager $manager): int
    {
        $manifests = $manager->manifests();

        if ($manifests->isEmpty()) {
            $this->warn('No extensions found.');

            return self::SUCCESS;
        }

        $rows = $manifests->map(fn ($m) => [
            $m->identifier,
            $m->name,
            $m->type,
            $m->version ?? '-',
            $m->providerClass ? 'Yes' : 'No',
        ]);

        $this->table(['Identifier', 'Name', 'Type', 'Version', 'Provider'], $rows);

        return self::SUCCESS;
    }
}
