<?php

namespace App\Providers;

use App\Models\Team;
use App\Models\User;
use App\Repositories\TeamRepository;
use App\Repositories\UserRepository;
use App\Services\Contracts\TeamServiceInterface;
use App\Services\TeamService;
use Illuminate\Support\ServiceProvider;

/**
 * Repository Service Provider
 *
 * Binds repository and service interfaces to their implementations.
 * This allows for proper dependency injection and testing.
 */
class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Repositories
        $this->app->bind(TeamRepository::class, fn () => new TeamRepository(new Team));
        $this->app->bind(UserRepository::class, fn () => new UserRepository(new User));

        // Services
        $this->app->bind(TeamServiceInterface::class, TeamService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
