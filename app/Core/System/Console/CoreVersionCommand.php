<?php

namespace App\Core\System\Console;

use App\Core\System\CoreVersion;
use Illuminate\Console\Command;

final class CoreVersionCommand extends Command
{
    protected $signature = 'core:version';

    protected $description = 'Display the current LaStarter version';

    public function handle(): int
    {
        $version = CoreVersion::current();

        $this->info("LaStarter v{$version->current}");

        return self::SUCCESS;
    }
}
