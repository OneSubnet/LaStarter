<?php

namespace Modules\Forms\Models;

use App\Concerns\HasTeam;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Form extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'forms';

    protected $fillable = [
        'team_id',
        'user_id',
        'title',
        'description',
        'slug',
        'status',
        'settings',
        'responses_count',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'responses_count' => 'integer',
        ];
    }

    public function questions()
    {
        return $this->hasMany(FormQuestion::class)->orderBy('order');
    }

    public function submissions()
    {
        return $this->hasMany(FormSubmission::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $form) {
            if (empty($form->slug)) {
                $form->slug = Str::slug($form->title);
            }
        });
    }
}
