<?php

namespace App\Models;

use App\Core\Extensions\ExtensionManifest;
use App\Core\Extensions\ExtensionState;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Extension extends Model
{
    protected $fillable = [
        'name',
        'identifier',
        'type',
        'version',
        'description',
        'path',
        'provider_class',
        'is_active',
        'state',
        'error_message',
        'author',
        'update_url',
        'lastarter_version',
        'installed_at',
        'manifest_json',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'state' => ExtensionState::class,
            'installed_at' => 'datetime',
            'manifest_json' => 'array',
        ];
    }

    public function teamExtensions(): HasMany
    {
        return $this->hasMany(TeamExtension::class);
    }

    public function manifest(): ?ExtensionManifest
    {
        if (! $this->manifest_json) {
            return null;
        }

        return ExtensionManifest::fromArray($this->manifest_json, $this->path);
    }

    public function isEnabled(): bool
    {
        return $this->state === ExtensionState::Enabled;
    }

    public function isErrored(): bool
    {
        return $this->state === ExtensionState::Errored;
    }

    public function isCompatible(): bool
    {
        return $this->state !== ExtensionState::Incompatible;
    }

    public function markAsErrored(string $message): void
    {
        $this->update([
            'state' => ExtensionState::Errored,
            'error_message' => $message,
        ]);
    }

    public function markAsIncompatible(): void
    {
        $this->update([
            'state' => ExtensionState::Incompatible,
            'error_message' => 'This extension is not compatible with the current version of LaStarter.',
        ]);
    }
}
