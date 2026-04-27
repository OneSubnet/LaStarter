<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Event extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'ai_events';

    protected $fillable = [
        'team_id',
        'client_id',
        'title',
        'slug',
        'description',
        'type',
        'status',
        'start_date',
        'end_date',
        'location',
        'form_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $event) {
            if (empty($event->slug)) {
                $slug = Str::slug($event->title);
                $original = $slug;
                $count = 2;
                while (self::withTrashed()->where('slug', $slug)->exists()) {
                    $slug = $original.'-'.$count++;
                }
                $event->slug = $slug;
            }
        });
    }
}
