<?php

namespace App\Http\Controllers;

use App\Core\Dashboard\DashboardWidgetBag;
use App\Core\Hooks\Hook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $bag = new DashboardWidgetBag;
        $from = $request->query('from');
        $to = $request->query('to');

        Event::dispatch('hooks.'.Hook::DASHBOARD_RENDER, [$bag, $from, $to]);

        return Inertia::render('dashboard', [
            'widgets' => $bag->all(),
        ]);
    }
}
