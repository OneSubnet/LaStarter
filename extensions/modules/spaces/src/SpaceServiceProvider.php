<?php

namespace Modules\Spaces;

use App\Core\Dashboard\DashboardWidgetBag;
use App\Core\Hooks\Hook;
use App\Core\Modules\ModuleServiceProvider;
use Modules\Spaces\Models\Space;
use Modules\Spaces\Models\SpaceDocument;
use Modules\Spaces\Policies\SpaceDocumentPolicy;
use Modules\Spaces\Policies\SpacePolicy;

class SpaceServiceProvider extends ModuleServiceProvider
{
    protected string $identifier = 'spaces';

    protected array $policies = [
        Space::class => SpacePolicy::class,
        SpaceDocument::class => SpaceDocumentPolicy::class,
    ];

    public function __construct($app)
    {
        parent::__construct($app);
        $this->basePath = base_path('extensions/modules/spaces');
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
                'spaces',
                'Spaces',
                'Secure spaces',
                'Lock',
                'stat',
                Space::count(),
                15,
            );
        });

        Hook::dispatch(Hook::MODULE_BOOT, ['module' => 'spaces']);
    }
}
