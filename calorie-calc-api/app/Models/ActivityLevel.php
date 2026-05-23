<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActivityLevel extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'multiplier',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'multiplier' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    public function nutritionGoals(): HasMany
    {
        return $this->hasMany(NutritionGoal::class);
    }
}