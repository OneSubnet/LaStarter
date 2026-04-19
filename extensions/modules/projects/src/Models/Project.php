<?php

namespace Modules\Projects\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasTeam;

    protected $table = 'projects';

    protected $fillable = [
        'team_id',
        'name',
        'description',
        'status',
        'priority',
        'due_date',
        'color',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'priority' => 'string',
            'due_date' => 'date',
        ];
    }
}
