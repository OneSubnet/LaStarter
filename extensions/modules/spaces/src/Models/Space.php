<?php

namespace Modules\Spaces\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Space extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'spaces';

    protected $fillable = [
        'team_id',
        'name',
        'slug',
        'description',
        'visibility',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function members()
    {
        return $this->hasMany(SpaceMember::class);
    }

    public function documents()
    {
        return $this->hasMany(SpaceDocument::class);
    }

    public function activityLog()
    {
        return $this->hasMany(SpaceActivityLog::class);
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $space) {
            if (empty($space->slug)) {
                $space->slug = Str::slug($space->name);
            }
        });
    }
}
