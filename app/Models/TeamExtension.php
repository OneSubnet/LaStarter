<?php

namespace App\Models;

use App\Core\Extensions\ExtensionState;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamExtension extends Model
{
    protected $fillable = [
        'team_id',
        'extension_id',
        'is_active',
        'state',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'state' => ExtensionState::class,
            'settings' => 'array',
        ];
    }

    /**
     * Get the team this extension activation belongs to.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the extension this activation belongs to.
     */
    public function extension(): BelongsTo
    {
        return $this->belongsTo(Extension::class);
    }
}
