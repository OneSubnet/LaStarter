<?php

use App\Core\Hooks\Hook;
use Illuminate\Support\Facades\Event;

describe('Hook System', function () {
    afterEach(function () {
        Hook::forget('test.event');
    });

    test('listen registers event listener with hooks prefix', function () {
        $received = null;

        Hook::listen('test.event', function ($data) use (&$received) {
            $received = $data;
        });

        Hook::dispatch('test.event', ['data' => 'hello']);

        expect($received)->toBe('hello');
    });

    test('dispatch fires event with hooks prefix', function () {
        $received = null;

        Event::listen('hooks.test.event', function ($data) use (&$received) {
            $received = $data;
        });

        Hook::dispatch('test.event', ['data' => 42]);

        expect($received)->toBe(42);
    });

    test('forget removes listeners', function () {
        $called = false;

        Hook::listen('test.event', function () use (&$called) {
            $called = true;
        });

        Hook::forget('test.event');
        Hook::dispatch('test.event');

        expect($called)->toBeFalse();
    });
});
