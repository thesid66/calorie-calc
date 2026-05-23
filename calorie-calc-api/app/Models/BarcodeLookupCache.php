<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BarcodeLookupCache extends Model
{
    protected $table = 'barcode_lookup_cache';

    public const PROVIDER_OPEN_FOOD_FACTS = 'open_food_facts';

    public const STATUS_FOUND = 'found';
    public const STATUS_NOT_FOUND = 'not_found';
    public const STATUS_ERROR = 'error';
    public const STATUS_UNKNOWN = 'unknown';

    protected $fillable = [
        'food_id',
        'barcode',
        'provider',
        'status',
        'status_verbose',
        'product_name',
        'brand',
        'mapped_product',
        'raw_response',
        'last_fetched_at',
    ];

    protected function casts(): array
    {
        return [
            'mapped_product' => 'array',
            'raw_response' => 'array',
            'last_fetched_at' => 'datetime',
        ];
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }

    public function isFresh(): bool
    {
        $cacheDays = max(1, (int) config('services.open_food_facts.cache_days', 30));

        return $this->last_fetched_at !== null
            && $this->last_fetched_at->greaterThanOrEqualTo(now()->subDays($cacheDays));
    }
}