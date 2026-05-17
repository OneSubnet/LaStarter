<?php

namespace App\Http\Controllers\Settings;

use App\Core\System\BackupManager;
use App\Core\System\CoreUpdater;
use App\Core\System\CoreVersion;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

final class SystemUpdateController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        $this->authorize('system.update');
    }

    public function index(): Response
    {
        $coreVersion = CoreVersion::current();
        $backups = $this->buildBackupList();

        return Inertia::render('settings/system', [
            'coreVersion' => $coreVersion->current,
            'latestVersion' => $coreVersion->latest,
            'changelog' => $coreVersion->changelog,
            'updateAvailable' => $coreVersion->updateAvailable,
            'backups' => $backups,
        ]);
    }

    public function checkCore(): RedirectResponse
    {
        $version = app(CoreUpdater::class)->checkForUpdate();

        if ($version->updateAvailable) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => __('Update available: v:version', ['version' => $version->latest]),
            ]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Already up to date.'),
        ]);

        return back();
    }

    public function updateCore(): RedirectResponse
    {
        $result = app(CoreUpdater::class)->update();

        if ($result->success) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('Platform updated to v:version', ['version' => $result->toVersion]),
            ]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'error',
            'message' => __('Update failed: :errors', ['errors' => implode(', ', $result->errors)]),
        ]);

        return back();
    }

    /**
     * @return list<array{filename: string, type: string, size: int, created_at: string}>
     */
    private function buildBackupList(): array
    {
        return collect(app(BackupManager::class)->listAll())
            ->map(fn (array $b) => [
                'filename' => $b['filename'],
                'type' => $b['type'],
                'size' => $b['size'],
                'created_at' => $b['created_at'],
            ])
            ->all();
    }
}
