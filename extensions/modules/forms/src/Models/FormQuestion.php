<?php

namespace Modules\Forms\Models;

use Illuminate\Database\Eloquent\Model;

class FormQuestion extends Model
{
    protected $table = 'form_questions';

    public const TYPE_TEXT = 'text';
    public const TYPE_TEXTAREA = 'textarea';
    public const TYPE_EMAIL = 'email';
    public const TYPE_NUMBER = 'number';
    public const TYPE_SELECT = 'select';
    public const TYPE_RADIO = 'radio';
    public const TYPE_CHECKBOX = 'checkbox';
    public const TYPE_DATE = 'date';
    public const TYPE_FILE = 'file';
    public const TYPE_RATING = 'rating';
    public const TYPE_SCALE = 'scale';
    public const TYPE_YES_NO = 'yes_no';

    protected $fillable = [
        'form_id',
        'type',
        'label',
        'description',
        'options',
        'required',
        'order',
        'validation',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'required' => 'boolean',
            'order' => 'integer',
            'validation' => 'array',
        ];
    }

    public function form()
    {
        return $this->belongsTo(Form::class);
    }
}
