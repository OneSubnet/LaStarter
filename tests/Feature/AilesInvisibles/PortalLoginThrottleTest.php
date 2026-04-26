<?php

use Illuminate\Support\Facades\Route;
use Tests\Concerns\CreatesTeams;
use Tests\Concerns\WithAilesInvisibles;

uses(CreatesTeams::class, WithAilesInvisibles::class);

beforeEach(function () {
    $this->setupAIModule();

    // Register portal routes in test context (same as service provider does)
    Route::middleware('web')->group(base_path('extensions/modules/ailes-invisibles/routes/portal.php'));

    [, $this->team] = $this->createTeamWithOwner('Test Team');
});

describe('Portal login throttle', function () {
    test('portal login returns 429 after 5 failed attempts', function () {
        $url = '/portal/login';

        for ($i = 0; $i < 5; $i++) {
            $this->post($url, [
                'email' => 'nonexistent@example.com',
                'password' => 'wrong-password',
            ])->assertRedirect();
        }

        $this->post($url, [
            'email' => 'nonexistent@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(429);
    });

    test('portal login page is accessible', function () {
        $this->get('/portal/login')->assertOk();
    });
});
