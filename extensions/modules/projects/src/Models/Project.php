<?php

namespace Modules\Projects\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, HasTeam, SoftDeletes;

    protected $fillable = [
        'team_id',
        'name',
        'description',
        'status',
        'visibility',
        'deadline',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
        ];
    }
}
