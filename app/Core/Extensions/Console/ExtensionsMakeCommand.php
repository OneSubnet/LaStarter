<?php

namespace App\Core\Extensions\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ExtensionsMakeCommand extends Command
{
    protected $signature = 'extensions:make {name : The extension name}
                            {--type=module : Extension type (module or theme)}';

    protected $description = 'Scaffold a new extension';

    public function handle(): int
    {
        $name = $this->argument('name');
        $type = $this->option('type');

        if (! in_array($type, ['module', 'theme'])) {
            $this->error('Type must be "module" or "theme".');

            return self::FAILURE;
        }

        $slug = Str::slug($name);
        $basePath = base_path("extensions/{$type}s/{$slug}");

        if (File::exists($basePath)) {
            $this->error("Extension [{$slug}] already exists at {$basePath}.");

            return self::FAILURE;
        }

        $studly = Str::studly(str_replace('-', ' ', $name));
        $namespace = $type === 'module' ? "Modules\\{$studly}" : "Themes\\{$studly}";

        $dirs = $type === 'module'
            ? ['src/Controllers', 'src/Models', 'src/Policies', 'routes', 'database/migrations', 'resources/js/pages', 'resources/locales']
            : ['resources/js/overrides', 'resources/css'];

        foreach ($dirs as $dir) {
            File::ensureDirectoryExists("{$basePath}/{$dir}");
        }

        $manifest = [
            'identifier' => $slug,
            'name' => $name,
            'type' => $type,
            'version' => '1.0.0',
            'description' => "{$name} {$type}",
            'provider' => "{$namespace}\\{$studly}ServiceProvider",
            'namespace' => $namespace,
            'permissions' => ["{$slug}.view", "{$slug}.create", "{$slug}.update", "{$slug}.delete"],
            'navigation' => $type === 'module' ? [
                'app' => [[
                    'title' => $name,
                    'icon' => 'Package',
                    'route' => "{$slug}.index",
                    'permission' => "{$slug}.view",
                    'order' => 50,
                ]],
            ] : new \stdClass,
        ];

        File::put(
            "{$basePath}/extension.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        if ($type === 'module') {
            $providerClass = "{$studly}ServiceProvider";
            $providerContent = <<<PHP
<?php

namespace {$namespace};

use App\Core\Modules\ModuleServiceProvider;

class {$providerClass} extends ModuleServiceProvider
{
    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        //
    }

    protected function modulePath(): string
    {
        return dirname(__DIR__);
    }

    protected function moduleNamespace(): string
    {
        return '{$namespace}';
    }
}
PHP;
            File::put("{$basePath}/src/{$providerClass}.php", $providerContent);
        }

        $this->info("Extension [{$slug}] scaffolded at {$basePath}");
        $this->line('Next: php artisan extensions:scan');

        return self::SUCCESS;
    }
}
