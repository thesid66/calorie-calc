<?php

namespace App\Http\Requests\Goals;

use Illuminate\Foundation\Http\FormRequest;

class StoreNutritionGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * maintain does not need target_rate_kg_per_week.
     * lose/gain must provide a safe rate.
     */
    public function rules(): array
    {
        return [
            'activity_level_id' => ['required', 'integer', 'exists:activity_levels,id'],
            'goal_type' => ['required', 'in:lose,maintain,gain'],
            'target_rate_kg_per_week' => [
                'nullable',
                'required_unless:goal_type,maintain',
                'numeric',
                'min:0.10',
                'max:1.00',
            ],
        ];
    }
}