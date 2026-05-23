<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealEntry extends Model
{
    protected $table = 'meal_entries';

    public const MEAL_BREAKFAST = 'breakfast';
    public const MEAL_LUNCH = 'lunch';
    public const MEAL_DINNER = 'dinner';
    public const MEAL_SNACK = 'snack';

    protected $fillable = [
        'user_id',
        'food_id',
        'logged_for_date',
        'meal_type',
        'food_name_snapshot',
        'quantity',
        'serving_label',
        'serving_grams',
        'total_grams',
        'calories',
        'protein_g',
        'carbs_g',
        'fat_g',
        'fiber_g',
        'sugar_g',
        'sodium_mg',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'logged_for_date' => 'date',

            'quantity' => 'decimal:2',
            'serving_grams' => 'decimal:2',
            'total_grams' => 'decimal:2',

            'calories' => 'decimal:2',
            'protein_g' => 'decimal:2',
            'carbs_g' => 'decimal:2',
            'fat_g' => 'decimal:2',
            'fiber_g' => 'decimal:2',
            'sugar_g' => 'decimal:2',
            'sodium_mg' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }
}