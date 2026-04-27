<?php

namespace Modules\AilesInvisibles\Models;

use App\Models\Team;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class ClientUser extends Authenticatable
{
    use Notifiable;

    protected $table = 'ai_client_users';

    protected $guard = 'client';

    protected $fillable = [
        'team_id',
        'client_id',
        'email',
        'password',
        'name',
        'access_token',
        'public_key',
        'locale',
        'last_login_at',
        'password_set_at',
    ];

    protected $hidden = [
        'password',
        'access_token',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'password_set_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public static function generateAccessToken(): string
    {
        return Str::random(64);
    }
}
