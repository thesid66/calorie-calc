<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodAlias extends Model
{
    protected $fillable = [
        'food_id',
        'alias',
        'locale',
    ];

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class);
    }
}