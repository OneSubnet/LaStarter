<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->onboarding_completed) {
            $team = $user->currentTeam;

            return to_route('dashboard', ['current_team' => $team?->slug ?? $user->personalTeam()?->slug]);
        }

        return Inertia::render('onboarding/Index', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'onboarding_step' => $user->onboarding_step,
            ],
            'team' => $user->currentTeam ? [
                'name' => $user->currentTeam->name,
                'slug' => $user->currentTeam->slug,
                'icon_url' => $user->currentTeam->iconUrl(),
            ] : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $step = (int) $request->input('step', $user->onboarding_step);

        $rules = match ($step) {
            0 => ['name' => ['required', 'string', 'max:255']],
            1 => ['team_name' => ['required', 'string', 'max:255']],
            2 => ['emails' => ['array'], 'emails.*' => ['email']],
            3 => ['role' => ['required', 'string']],
            default => [],
        };

        $validated = $request->validate($rules);

        switch ($step) {
            case 0:
                $user->update(['name' => $validated['name']]);
                break;
            case 1:
                if ($user->currentTeam) {
                    $user->currentTeam->update(['name' => $validated['team_name']]);
                }
                break;
            case 2:
                // Invitations handled on frontend via existing invitation API
                break;
            case 3:
                // Role preference stored as team setting
                if ($user->currentTeam) {
                    setting_set('onboarding_role', $validated['role'], $user->currentTeam->id);
                }
                break;
        }

        $nextStep = $step + 1;
        $completed = $nextStep >= 4;

        $user->update([
            'onboarding_step' => $completed ? 4 : $nextStep,
            'onboarding_completed' => $completed,
        ]);

        if ($completed) {
            $team = $user->currentTeam;

            return to_route('dashboard', ['current_team' => $team?->slug]);
        }

        return to_route('onboarding', ['current_team' => $request->route('current_team')]);
    }
}
