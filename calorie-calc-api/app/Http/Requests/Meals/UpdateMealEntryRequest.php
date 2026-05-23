<?php

namespace App\Http\Requests\Meals;

class UpdateMealEntryRequest extends StoreMealEntryRequest
{
    /**
     * Uses the same rules as store because our PUT endpoint replaces the full
     * meal entry calculation.
     */
}