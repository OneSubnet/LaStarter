<?php

namespace App\Http\Controllers;

use App\Core\Widgets\WidgetDataProvider;
use App\Core\Widgets\WidgetRegistry;
use App\Models\DashboardLayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly WidgetDataProvider $widgetDataProvider,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = Auth::user();
        $teamId = $user->current_team_id;

        $layout = DashboardLayout::forUser($user->id)->first();

        if ($layout === null) {
            $layout = $this->createDefaultLayout($user->id, $teamId);
        }

        $widgets = $layout->widgets ?? [];
        $dateFrom = $request->query('from');
        $dateTo = $request->query('to');
        $widgetData = $this->widgetDataProvider->resolveBatch($widgets, $teamId, $dateFrom, $dateTo);
        $availableWidgets = app(WidgetRegistry::class)->forTeam($teamId, $user);

        return Inertia::render('dashboard', [
            'dashboardLayout' => [
                'id' => $layout->id,
                'layout' => $layout->layout ?? [],
                'widgets' => $widgets,
                'widgetData' => $widgetData,
                'isDefault' => $layout->is_default,
            ],
            'availableWidgets' => $availableWidgets,
        ]);
    }

    public function widgetData(Request $request): JsonResponse
    {
        $user = Auth::user();
        $teamId = $user->current_team_id;

        $layout = DashboardLayout::forUser($user->id)->first();
        $widgets = $layout?->widgets ?? [];

        $dateFrom = $request->query('from');
        $dateTo = $request->query('to');
        $widgetData = $this->widgetDataProvider->resolveBatch($widgets, $teamId, $dateFrom, $dateTo);

        return response()->json(['widgetData' => $widgetData]);
    }

    public function updateLayout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'layout' => 'required|array',
            'layout.*.i' => 'required|string',
            'layout.*.x' => 'required|integer',
            'layout.*.y' => 'required|integer',
            'layout.*.w' => 'required|integer',
            'layout.*.h' => 'required|integer',
            'widgets' => 'required|array',
            'widgets.*.id' => 'required|string',
            'widgets.*.identifier' => 'required|string',
            'widgets.*.displayMode' => 'nullable|string|in:stat,chart,table',
        ]);

        $user = Auth::user();

        $layout = DashboardLayout::forUser($user->id)->first();

        if ($layout === null) {
            $layout = new DashboardLayout;
            $layout->user_id = $user->id;
            $layout->team_id = $user->current_team_id;
        }

        $layout->layout = $validated['layout'];
        $layout->widgets = collect($validated['widgets'])->map(fn ($w) => [
            'id' => $w['id'],
            'identifier' => $w['identifier'],
            'displayMode' => $w['displayMode'] ?? null,
        ])->all();
        $layout->save();

        return back();
    }

    public function destroyLayout(): RedirectResponse
    {
        $layout = DashboardLayout::forUser(Auth::id())->first();

        if ($layout) {
            $layout->delete();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Dashboard reset to default.'),
        ]);

        return Redirect::route('dashboard', [
            'current_team' => Auth::user()->currentTeam->slug,
        ]);
    }

    public function setDefault(): RedirectResponse
    {
        $layout = DashboardLayout::forUser(Auth::id())->first();

        if ($layout) {
            DashboardLayout::forUser(Auth::id())
                ->where('id', '!=', $layout->id)
                ->update(['is_default' => false]);

            $layout->update(['is_default' => true]);
        }

        return back();
    }

    private function createDefaultLayout(int $userId, int $teamId): DashboardLayout
    {
        $widgets = [];
        $layout = [];
        $x = 0;
        $y = 0;

        $available = app(WidgetRegistry::class)->forTeam($teamId, Auth::user());

        foreach ($available as $widget) {
            $id = $widget->identifier;
            $widgets[] = ['id' => $id, 'identifier' => $id, 'displayMode' => null];
            $layout[] = [
                'i' => $id,
                'x' => $x,
                'y' => $y,
                'w' => $widget->size['w'],
                'h' => $widget->size['h'],
            ];

            $x += $widget->size['w'];
            if ($x >= 12) {
                $x = 0;
                $y += 2;
            }
        }

        return DashboardLayout::create([
            'user_id' => $userId,
            'team_id' => $teamId,
            'layout' => $layout,
            'widgets' => $widgets,
            'is_default' => true,
        ]);
    }
}
