<?php

namespace App\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    use HasTeam;

    protected $fillable = [
        'team_id',
        'module',
        'identifier',
        'locale',
        'subject',
        'html_content',
        'editor_state',
        'is_default',
    ];

    protected $casts = [
        'editor_state' => 'array',
        'is_default' => 'boolean',
    ];

    public function scopeForTeam($query, int $teamId)
    {
        return $query->where('team_id', $teamId);
    }

    public function scopeByModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    public function scopeByIdentifier($query, string $identifier)
    {
        return $query->where('identifier', $identifier);
    }

    public function scopeByLocale($query, string $locale)
    {
        return $query->where('locale', $locale);
    }

    public function scopeDefaults($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_default', false);
    }

    public function getModuleLabel(): string
    {
        return match ($this->module) {
            'core' => 'Platform',
            'lms' => 'LMS',
            default => ucfirst($this->module),
        };
    }
}
