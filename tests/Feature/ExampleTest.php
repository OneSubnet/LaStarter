<?php

test('home redirects to login', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect('/login');
});
