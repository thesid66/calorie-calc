<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NutritionGoal extends Model
{
    protected $fillable = [
        'user_id',
        'activity_level_id',
        'goal_type',
        'target_rate_kg_per_week',
        'bmr',
        'tdee',
        'daily_calorie_target',
        'protein_target_g',
        'carb_target_g',
        'fat_target_g',
        'calculated_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'target_rate_kg_per_week' => 'decimal:2',
            'calculated_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function activityLevel(): BelongsTo
    {
        return $this->belongsTo(ActivityLevel::class);
    }
}