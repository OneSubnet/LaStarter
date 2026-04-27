<?php

namespace App\Http\Controllers;

use App\Core\Dashboard\DashboardWidgetBag;
use App\Core\Hooks\Hook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;

class DashboardDataController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $bag = new DashboardWidgetBag;

        Event::dispatch('hooks.'.Hook::DASHBOARD_RENDER, [$bag, $from, $to]);

        return response()->json([
            'widgets' => $bag->all(),
        ]);
    }
}
