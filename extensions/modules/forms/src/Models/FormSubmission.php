<?php

namespace Modules\Forms\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class FormSubmission extends Model
{
    protected $table = 'form_submissions';

    protected $fillable = [
        'form_id',
        'user_id',
        'status',
        'responses',
    ];

    protected function casts(): array
    {
        return [
            'responses' => 'array',
        ];
    }

    public function form()
    {
        return $this->belongsTo(Form::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
