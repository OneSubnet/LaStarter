<?php

namespace App\Providers;

use App\Domain\Bus\CommandBus;
use App\Domain\Bus\QueryBus;
use App\Domains\Team\Commands\CreateTeamCommand;
use App\Domains\Team\Commands\DeleteTeamCommand;
use App\Domains\Team\Commands\Handlers\CreateTeamHandler;
use App\Domains\Team\Commands\Handlers\DeleteTeamHandler;
use App\Domains\Team\Commands\Handlers\UpdateTeamHandler;
use App\Domains\Team\Commands\UpdateTeamCommand;
use App\Domains\Team\Queries\GetTeamById;
use App\Domains\Team\Queries\GetTeamsForUser;
use App\Domains\Team\Queries\Handlers\GetTeamByIdHandler;
use App\Domains\Team\Queries\Handlers\GetTeamsForUserHandler;
use App\Domains\Team\Queries\Handlers\SearchTeamsHandler;
use App\Domains\Team\Queries\SearchTeams;
use Illuminate\Support\ServiceProvider;

class CqrsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CommandBus::class, function () {
            $bus = new CommandBus($this->app);

            // Register Team command handlers
            $bus->registerHandlers([
                CreateTeamCommand::class => CreateTeamHandler::class,
                UpdateTeamCommand::class => UpdateTeamHandler::class,
                DeleteTeamCommand::class => DeleteTeamHandler::class,
            ]);

            return $bus;
        });

        $this->app->singleton(QueryBus::class, function () {
            $bus = new QueryBus($this->app);

            // Register Team query handlers
            $bus->registerHandlers([
                GetTeamById::class => GetTeamByIdHandler::class,
                GetTeamsForUser::class => GetTeamsForUserHandler::class,
                SearchTeams::class => SearchTeamsHandler::class,
            ]);

            return $bus;
        });
    }
}
