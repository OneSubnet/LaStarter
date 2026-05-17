<?php

namespace App\Http\Controllers\Settings;

use App\Core\System\BackupManager;
use App\Core\System\Events\BackupCreated;
use App\Core\System\Events\BackupDeleted;
use App\Core\System\Events\BackupRestored;
use App\Core\System\SignedDownloadUrl;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class BackupController extends Controller
{
    public function __construct(
        private readonly BackupManager $backups,
        private readonly SignedDownloadUrl $urlSigner,
    ) {
        $this->authorize('system.update');
    }

    public function storeCore(): RedirectResponse
    {
        $path = $this->backups->create();
        $filename = basename($path);

        event(new BackupCreated($filename, 'core', $path));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Core backup created: :file', ['file' => $filename]),
        ]);

        return back();
    }

    public function storeDatabase(): RedirectResponse
    {
        $path = $this->backups->createDatabaseBackup();
        $filename = basename($path);

        event(new BackupCreated($filename, 'database', $path));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Database backup created: :file', ['file' => $filename]),
        ]);

        return back();
    }

    public function generateDownloadUrl(Request $request): JsonResponse
    {
        $filename = $request->validate([
            'filename' => ['required', 'string'],
        ])['filename'];

        $path = $this->backups->resolvePath($filename);

        if ($path === null) {
            abort(404);
        }

        return response()->json([
            'url' => $this->urlSigner->generate($filename),
        ]);
    }

    /**
     * Serve a backup file via signed URL (no session auth required).
     */
    public function download(Request $request): BinaryFileResponse
    {
        $payload = $request->query('payload', '');
        $signature = $request->query('signature', '');

        $filename = $this->urlSigner->validate($payload, $signature);

        if ($filename === null) {
            abort(403, __('Backup download link expired or invalid.'));
        }

        $path = $this->backups->resolvePath($filename);

        if ($path === null) {
            abort(404);
        }

        return response()->download($path, $filename);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $filename = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
        ])['filename'];
        $deleted = $this->backups->delete($filename);

        if (! $deleted) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Backup not found.'),
            ]);

            return back();
        }

        event(new BackupDeleted($filename, $this->backups->detectType($filename)));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Backup deleted.'),
        ]);

        return back();
    }

    public function restore(Request $request): RedirectResponse
    {
        $filename = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
        ])['filename'];
        $restored = $this->backups->restore($filename);

        if (! $restored) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Backup restore failed.'),
            ]);

            return back();
        }

        event(new BackupRestored($filename, $this->backups->detectType($filename)));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Backup restored.'),
        ]);

        return back();
    }
}
