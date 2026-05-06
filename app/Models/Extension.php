<?php

namespace App\Models;

use App\Core\Extensions\ExtensionManifest;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'identifier', 'name', 'type', 'version', 'description',
    'author', 'provider_class', 'namespace', 'permissions',
    'navigation', 'settings', 'path', 'state',
    'dependencies', 'minimum_core_version', 'provides', 'widgets', 'metrics',
])]
class Extension extends Model
{
    protected $casts = [
        'permissions' => 'array',
        'navigation' => 'array',
        'settings' => 'array',
        'dependencies' => 'array',
        'provides' => 'array',
        'widgets' => 'array',
        'metrics' => 'array',
    ];

    /**
     * @return HasMany<TeamExtension, $this>
     */
    public function teamExtensions(): HasMany
    {
        return $this->hasMany(TeamExtension::class);
    }

    public function toManifest(): ?ExtensionManifest
    {
        if (! $this->path || ! file_exists($this->path.'/extension.json')) {
            return null;
        }

        return ExtensionManifest::fromFile($this->path);
    }
}
