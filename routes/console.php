<?php

use App\Core\System\CoreUpdater;
use App\Core\System\Events\CoreUpdateAvailable;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    $version = app(CoreUpdater::class)->checkForUpdate();

    if ($version->updateAvailable) {
        Event::dispatch(new CoreUpdateAvailable(
            $version->current,
            $version->latest,
            $version->changelog,
        ));
    }
})->daily()->at('03:00')->name('core:check-updates');
