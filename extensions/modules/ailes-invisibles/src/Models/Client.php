<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Modules\AilesInvisibles\Enums\ClientStatus;
use Modules\AilesInvisibles\Enums\ClientType;

class Client extends Model
{
    use HasFactory, HasTeam, SoftDeletes;

    protected $table = 'ai_clients';

    protected $fillable = [
        'team_id',
        'type',
        'first_name',
        'last_name',
        'email',
        'phone',
        'company_name',
        'vat_number',
        'vat_country',
        'address_line1',
        'address_line2',
        'city',
        'postal_code',
        'country',
        'notes',
        'status',
        'slug',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'type' => ClientType::class,
            'status' => ClientStatus::class,
            'metadata' => 'array',
        ];
    }

    public function fullName(): string
    {
        return trim($this->first_name.' '.$this->last_name);
    }

    public function portalUser()
    {
        return $this->hasOne(ClientUser::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function events()
    {
        return $this->hasMany(Event::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function documents()
    {
        return $this->hasMany(PortalDocument::class);
    }

    public function isPro(): bool
    {
        return $this->type === ClientType::Pro;
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $client) {
            if (empty($client->slug)) {
                $slug = Str::slug($client->first_name.'-'.$client->last_name);
                $original = $slug;
                $count = 2;
                while (self::withTrashed()->where('slug', $slug)->exists()) {
                    $slug = $original.'-'.$count++;
                }
                $client->slug = $slug;
            }
        });
    }
}
