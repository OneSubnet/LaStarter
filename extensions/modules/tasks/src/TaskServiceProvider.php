<?php

namespace Modules\Tasks;

use App\Core\Dashboard\DashboardWidgetBag;
use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;
use Modules\Tasks\Models\Task;
use Modules\Tasks\Policies\TaskPolicy;

class TaskServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'tasks';

    protected array $policies = [
        Task::class => TaskPolicy::class,
    ];

    public function __construct($app)
    {
        parent::__construct($app);
        $this->basePath = base_path('extensions/modules/tasks');
    }

    protected function registerModule(): void
    {
        //
    }

    protected function bootModule(): void
    {
        $this->loadModuleMigrations();

        Hook::listen(Hook::DASHBOARD_RENDER, function (DashboardWidgetBag $bag) {
            $bag->add(
                'tasks',
                'Tasks',
                'Total tasks',
                'ListChecks',
                'stat',
                Task::count(),
                20,
            );
        });

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'tasks']);
    }
}
