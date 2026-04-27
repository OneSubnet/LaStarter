<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DashboardDataController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Settings\ExtensionController;
use App\Http\Controllers\Settings\MarketplaceController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\TeamMailController;
use App\Http\Controllers\Settings\TeamMembersController;
use App\Http\Controllers\Settings\TeamRolesController;
use App\Http\Controllers\Settings\TeamSettingsController;
use App\Http\Controllers\Teams\TeamController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// Account settings — global routes (no team slug in URL)
Route::prefix('settings')
    ->middleware(['auth', 'verified'])
    ->group(function () {
        Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        Route::get('security', [SecurityController::class, 'edit'])->name('security.edit');
        Route::put('password', [SecurityController::class, 'update'])
            ->middleware('throttle:6,1')
            ->name('user-password.update');

        Route::inertia('appearance', 'settings/appearance')->name('appearance.edit');

        Route::put('/settings/locale', function (Request $request) {
            $validated = $request->validate(['locale' => 'required|string|in:en,fr']);

            $user = $request->user();
            $user->update(['locale' => $validated['locale']]);

            // Also update team locale if user is in a team context
            $team = $user->currentTeam;
            if ($team) {
                $team->update(['locale' => $validated['locale']]);
            }

            return back();
        })->name('settings.locale.update');
    });

// IMPORTANT: Do NOT use `php artisan route:cache` — module routes are loaded
// dynamically by module service providers and must be resolved at runtime.

// Team-scoped routes — exclude 'portal' prefix so module portal routes don't collide
Route::prefix('{current_team}')
    ->where(['current_team' => '(?!portal)[^/]+'])
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::get('dashboard/data', DashboardDataController::class)->name('dashboard.data');
        Route::get('onboarding', [OnboardingController::class, 'index'])->name('onboarding');
        Route::post('onboarding', [OnboardingController::class, 'update'])->name('onboarding.update');

        // Notifications
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');

        // Settings
        Route::prefix('settings')->group(function () {
            Route::redirect('/', '{current_team}/settings/general');

            // Teams listing
            Route::get('teams', [TeamController::class, 'index'])->name('settings.teams.index');
            Route::post('teams', [TeamController::class, 'store'])->name('settings.teams.store');
            Route::post('teams/{team}/switch', [TeamController::class, 'switch'])->name('settings.teams.switch');

            // Team settings
            Route::get('general', [TeamSettingsController::class, 'edit'])->name('settings.team.general');
            Route::patch('general', [TeamSettingsController::class, 'update'])->name('settings.team.update');
            Route::post('general/icon', [TeamSettingsController::class, 'updateIcon'])->name('settings.team.icon');
            Route::delete('general/icon', [TeamSettingsController::class, 'removeIcon'])->name('settings.team.icon.remove');
            Route::post('general/footer-links', [TeamSettingsController::class, 'updateFooterLinks'])->name('settings.team.footer-links');
            Route::delete('general', [TeamController::class, 'destroy'])->name('settings.team.destroy');

            // Members
            Route::get('members', [TeamMembersController::class, 'index'])->name('settings.team.members');
            Route::patch('members/{user}', [TeamMembersController::class, 'update'])->name('settings.team.members.update');
            Route::delete('members/{user}', [TeamMembersController::class, 'destroy'])->name('settings.team.members.destroy');

            // Invitations
            Route::post('invitations', [TeamInvitationController::class, 'store'])->name('settings.team.invitations.store');
            Route::delete('invitations/{invitation_code}', [TeamInvitationController::class, 'destroy'])->name('settings.team.invitations.destroy');

            // Roles
            Route::get('roles', [TeamRolesController::class, 'index'])->name('settings.team.roles');
            Route::post('roles', [TeamRolesController::class, 'store'])->name('settings.team.roles.store');
            Route::patch('roles/{role}', [TeamRolesController::class, 'update'])->name('settings.team.roles.update');
            Route::delete('roles/{role}', [TeamRolesController::class, 'destroy'])->name('settings.team.roles.destroy');

            // Extensions
            Route::get('extensions', [ExtensionController::class, 'index'])->name('settings.team.extensions');
            Route::get('extensions/{extension}', [ExtensionController::class, 'show'])->name('settings.team.extensions.show');
            Route::post('extensions/{extension}/install', [ExtensionController::class, 'install'])->name('settings.team.extensions.install');
            Route::post('extensions/{extension}/uninstall', [ExtensionController::class, 'uninstall'])->name('settings.team.extensions.uninstall');
            Route::post('extensions/{extension}/enable', [ExtensionController::class, 'enable'])->name('settings.team.extensions.enable');
            Route::post('extensions/{extension}/disable', [ExtensionController::class, 'disable'])->name('settings.team.extensions.disable');

            // Marketplace
            Route::get('marketplace', [MarketplaceController::class, 'index'])->name('settings.team.marketplace');
            Route::get('marketplace/{owner}/{repo}', [MarketplaceController::class, 'show'])->name('settings.team.marketplace.show');
            Route::post('marketplace/install', [MarketplaceController::class, 'install'])->name('settings.team.marketplace.install');
            Route::post('extensions/upload', [MarketplaceController::class, 'upload'])->name('settings.team.extensions.upload');

            // Mail
            Route::get('mail', [TeamMailController::class, 'edit'])->name('settings.team.mail');
            Route::patch('mail', [TeamMailController::class, 'update'])->name('settings.team.mail.update');
            Route::post('mail/test', [TeamMailController::class, 'test'])->name('settings.team.mail.test');

            // Theme
            Route::get('theme', [ThemeController::class, 'edit'])->name('settings.team.theme.edit');
            Route::put('theme', [ThemeController::class, 'update'])->name('settings.team.theme.update');
        });
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation_code}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
});

Route::get('invitations/{invitation_code}', [TeamInvitationController::class, 'show'])->name('invitations.show');
Route::post('invitations/{invitation_code}/register', [TeamInvitationController::class, 'register'])->name('invitations.register');
