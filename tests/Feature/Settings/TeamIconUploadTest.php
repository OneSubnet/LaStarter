<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\CreatesTeams;

uses(CreatesTeams::class);

beforeEach(function () {
    [$this->owner, $this->team] = $this->createTeamWithOwner('Test Team');
    setupTeamAuth($this->owner, $this->team);

    Storage::fake('public');
});

describe('Team icon upload validation', function () {
    test('valid png image can be uploaded', function () {
        $file = UploadedFile::fake()->create('icon.png', 100, 'image/png');

        $response = $this->post(
            route('settings.team.icon', ['current_team' => $this->team->slug]),
            ['icon' => $file],
        );

        $response->assertRedirect();
        $this->team->refresh();
        expect($this->team->icon_path)->not->toBeNull();
    });

    test('valid jpg image can be uploaded', function () {
        $file = UploadedFile::fake()->create('icon.jpg', 100, 'image/jpeg');

        $response = $this->post(
            route('settings.team.icon', ['current_team' => $this->team->slug]),
            ['icon' => $file],
        );

        $response->assertRedirect();
        $this->team->refresh();
        expect($this->team->icon_path)->not->toBeNull();
    });

    test('valid svg file can be uploaded', function () {
        $svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>';
        $file = UploadedFile::fake()->createWithContent('icon.svg', $svgContent, 'image/svg+xml');

        $response = $this->post(
            route('settings.team.icon', ['current_team' => $this->team->slug]),
            ['icon' => $file],
        );

        $response->assertRedirect();
        $this->team->refresh();
        expect($this->team->icon_path)->not->toBeNull();
    });

    test('invalid file type is rejected', function () {
        $file = UploadedFile::fake()->create('icon.exe', 100, 'application/x-msdownload');

        $response = $this->post(
            route('settings.team.icon', ['current_team' => $this->team->slug]),
            ['icon' => $file],
        );

        $response->assertRedirect();
        $this->team->refresh();
        expect($this->team->icon_path)->toBeNull();
    });

    test('no file selected shows error', function () {
        $response = $this->post(
            route('settings.team.icon', ['current_team' => $this->team->slug]),
            [],
        );

        $response->assertRedirect();
        $this->team->refresh();
        expect($this->team->icon_path)->toBeNull();
    });

    test('icon can be removed', function () {
        $file = UploadedFile::fake()->create('icon.png', 100, 'image/png');
        $this->post(
            route('settings.team.icon', ['current_team' => $this->team->slug]),
            ['icon' => $file],
        );

        $this->team->refresh();
        expect($this->team->icon_path)->not->toBeNull();

        $response = $this->delete(
            route('settings.team.icon.remove', ['current_team' => $this->team->slug]),
        );

        $response->assertRedirect();
        expect($this->team->fresh()->icon_path)->toBeNull();
    });
});
