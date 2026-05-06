<?php

namespace App\Http\Controllers\Settings;

use App\Core\Extensions\Updater\UpdateService;
use App\Core\System\CoreUpdater;
use App\Core\System\CoreVersion;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SystemUpdateController extends Controller
{
    public function index(): Response
    {
        $coreVersion = CoreVersion::current();
        $extensions = [];

        try {
            $updates = app(UpdateService::class)->checkForUpdates();
            foreach ($updates as $identifier => $info) {
                $extensions[] = [
                    'identifier' => $identifier,
                    'current_version' => $info->currentVersion,
                    'latest_version' => $info->latestVersion,
                ];
            }
        } catch (\Throwable) {
            // Marketplace not configured
        }

        return Inertia::render('settings/system', [
            'coreVersion' => $coreVersion->current,
            'latestVersion' => $coreVersion->latest,
            'changelog' => $coreVersion->changelog,
            'updateAvailable' => $coreVersion->updateAvailable,
            'extensionUpdates' => $extensions,
        ]);
    }

    public function checkCore(): JsonResponse
    {
        $version = app(CoreUpdater::class)->checkForUpdate();

        return response()->json([
            'current' => $version->current,
            'latest' => $version->latest,
            'changelog' => $version->changelog,
            'update_available' => $version->updateAvailable,
        ]);
    }

    public function updateCore(): RedirectResponse
    {
        $result = app(CoreUpdater::class)->update();

        if ($result->success) {
            return back()->with('toast', [
                'type' => 'success',
                'message' => __('Platform updated to v:version', ['version' => $result->toVersion]),
            ]);
        }

        return back()->with('toast', [
            'type' => 'error',
            'message' => __('Update failed: :errors', ['errors' => implode(', ', $result->errors)]),
        ]);
    }

    public function checkExtensions(): JsonResponse
    {
        try {
            $updates = app(UpdateService::class)->checkForUpdates();

            return response()->json([
                'updates' => $updates->map(fn ($info) => [
                    'identifier' => $info->identifier,
                    'current_version' => $info->currentVersion,
                    'latest_version' => $info->latestVersion,
                ])->values(),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['updates' => [], 'error' => $e->getMessage()]);
        }
    }

    public function updateExtension(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'identifier' => 'required|string',
        ]);

        $report = app(UpdateService::class)->updateWithReport($validated['identifier']);

        if ($report->compatible) {
            return back()->with('toast', [
                'type' => 'success',
                'message' => __('Extension updated.'),
            ]);
        }

        return back()->with('toast', [
            'type' => 'error',
            'message' => __('Update blocked: :errors', ['errors' => implode(', ', $report->errors)]),
        ]);
    }
}
