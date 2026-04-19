<?php

namespace App\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;

class TeamSetting extends Model
{
    use HasTeam;

    protected $table = 'team_settings';

    protected $fillable = [
        'team_id',
        'key',
        'value',
    ];
}
