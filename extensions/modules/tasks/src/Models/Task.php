<?php

namespace Modules\Tasks\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Projects\Models\Project;

class Task extends Model
{
    use HasTeam;

    protected $table = 'tasks';

    protected $fillable = [
        'team_id',
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'priority' => 'string',
            'due_date' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
