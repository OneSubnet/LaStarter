<?php

namespace App\Console\Commands;

use App\Core\Extensions\ExtensionManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class DebugRoutesCommand extends Command
{
    protected $signature = 'debug:routes';

    protected $description = 'Debug routes and navigation';

    public function handle(): int
    {
        $this->info('=== All Registered Routes ===');

        $routes = Route::getRoutes()->get();

        $moduleRoutes = array_filter($routes, function ($route) {
            $uri = $route->uri;

            // Filter team-scoped routes
            return preg_match('#^[a-z0-9-]+/(clients|categories|catalogue|products)#', $uri);
        });

        foreach ($moduleRoutes as $route) {
            $this->line("  {$route->methods[0]} {$route->uri} -> {$route->getName()}");
        }

        $this->newLine();
        $this->info('=== Extension Manifests ===');

        $manager = app(ExtensionManager::class);
        $extensions = $manager->all();

        foreach ($extensions as $extension) {
            $manifest = $extension->manifest();
            if ($manifest) {
                $this->line("{$extension->name}:");
                if (isset($manifest->navigation['app'])) {
                    $this->line('  Navigation:');
                    foreach ($manifest->navigation['app'] as $item) {
                        $this->line("    - {$item['title']}");
                        if (isset($item['route'])) {
                            $this->line("      route: {$item['route']}");
                        }
                        if (isset($item['url'])) {
                            $this->line("      url: {$item['url']}");
                        }
                        if (isset($item['href'])) {
                            $this->line("      href: {$item['href']}");
                        }
                        if (isset($item['children'])) {
                            foreach ($item['children'] as $child) {
                                $this->line("      - {$child['title']}");
                                if (isset($child['route'])) {
                                    $this->line("        route: {$child['route']}");
                                }
                                if (isset($child['url'])) {
                                    $this->line("        url: {$child['url']}");
                                }
                                if (isset($child['href'])) {
                                    $this->line("        href: {$child['href']}");
                                }
                            }
                        }
                    }
                }
            }
        }

        return Command::SUCCESS;
    }
}
