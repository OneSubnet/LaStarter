<?php

namespace Modules\AilesInvisibles\Models;

use App\Concerns\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasTeam, SoftDeletes;

    protected $table = 'ai_products';

    protected $fillable = [
        'team_id',
        'category_id',
        'name',
        'slug',
        'description',
        'image_path',
        'sku',
        'reference',
        'type',
        'price',
        'unit',
        'stock',
        'stock_alert',
        'category',
        'tax_rate',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'stock' => 'integer',
            'stock_alert' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $product) {
            if (empty($product->slug)) {
                $slug = Str::slug($product->name);
                $original = $slug;
                $count = 2;
                while (self::withTrashed()->where('slug', $slug)->exists()) {
                    $slug = $original.'-'.$count++;
                }
                $product->slug = $slug;
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
