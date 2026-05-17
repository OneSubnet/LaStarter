<?php

namespace App\Actions\Invitations;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

final class RegisterInvitedUser
{
    /**
     * @param  array{name: string, email: string, password: string}  $data
     */
    public function handle(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
    }
}
