<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Food extends Model
{
    protected $table = 'foods';
    public const SOURCE_SYSTEM = 'system';
    public const SOURCE_USER = 'user';
    public const SOURCE_USDA = 'usda';
    public const SOURCE_OPEN_FOOD_FACTS = 'open_food_facts';
    public const SOURCE_MANUAL = 'manual';

    protected $fillable = [
        'created_by_user_id',
        'source',
        'source_id',
        'name',
        'nepali_name',
        'brand',
        'barcode',
        'food_type',
        'cuisine',
        'calories_per_100g',
        'protein_per_100g',
        'carbs_per_100g',
        'fat_per_100g',
        'fiber_per_100g',
        'sugar_per_100g',
        'sodium_mg_per_100g',
        'is_verified',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'calories_per_100g' => 'decimal:2',
            'protein_per_100g' => 'decimal:2',
            'carbs_per_100g' => 'decimal:2',
            'fat_per_100g' => 'decimal:2',
            'fiber_per_100g' => 'decimal:2',
            'sugar_per_100g' => 'decimal:2',
            'sodium_mg_per_100g' => 'decimal:2',
            'is_verified' => 'boolean',
            'is_public' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function servings(): HasMany
    {
        return $this->hasMany(FoodServing::class);
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(FoodAlias::class);
    }

    /**
     * Food visibility rule:
     * - public foods are visible to everyone
     * - private custom foods are visible only to the creator
     */
    public function scopeVisibleToUser(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $visibilityQuery) use ($user) {
            $visibilityQuery
                ->where('is_public', true)
                ->orWhere('created_by_user_id', $user->id);
        });
    }

    /**
     * Search across English name, Nepali name, brand, barcode, and aliases.
     * LOWER(...) keeps search case-insensitive in PostgreSQL.
     */
    public function scopeSearch(Builder $query, string $term): Builder
    {
        $term = trim(mb_strtolower($term));

        if ($term === '') {
            return $query;
        }

        $like = '%'.$term.'%';

        return $query->where(function (Builder $searchQuery) use ($like) {
            $searchQuery
                ->whereRaw('LOWER(name) LIKE ?', [$like])
                ->orWhereRaw('LOWER(nepali_name) LIKE ?', [$like])
                ->orWhereRaw('LOWER(brand) LIKE ?', [$like])
                ->orWhereRaw('LOWER(barcode) LIKE ?', [$like])
                ->orWhereHas('aliases', function (Builder $aliasQuery) use ($like) {
                    $aliasQuery->whereRaw('LOWER(alias) LIKE ?', [$like]);
                });
        });
    }

    public function mealEntries(): HasMany
    {
        return $this->hasMany(MealEntry::class);
    }
}