<?php

namespace App\Http\Requests\Meals;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMealEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Two logging modes:
     *
     * 1. food
     *    User selects a food from database and either selects a serving
     *    or enters total grams.
     *
     * 2. manual
     *    User logs calories/macros directly without selecting a food.
     */
    public function rules(): array
    {
        return [
            'entry_mode' => ['required', 'in:food,manual'],

            'logged_for_date' => ['required', 'date'],
            'meal_type' => ['required', 'in:breakfast,lunch,dinner,snack'],
            'notes' => ['nullable', 'string', 'max:1000'],

            /**
             * Food mode fields.
             */
            'food_id' => ['nullable', 'required_if:entry_mode,food', 'integer', 'exists:foods,id'],
            'food_serving_id' => ['nullable', 'integer', 'exists:food_servings,id'],
            'quantity' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
            'total_grams' => ['nullable', 'numeric', 'min:0.10', 'max:10000'],

            /**
             * Manual mode fields.
             */
            'manual_food_name' => ['nullable', 'required_if:entry_mode,manual', 'string', 'min:2', 'max:180'],
            'serving_label' => ['nullable', 'string', 'max:80'],

            'calories' => ['nullable', 'required_if:entry_mode,manual', 'numeric', 'min:0', 'max:10000'],
            'protein_g' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'carbs_g' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'fat_g' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'fiber_g' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'sugar_g' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'sodium_mg' => ['nullable', 'numeric', 'min:0', 'max:100000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('entry_mode') !== 'food') {
                return;
            }

            /**
             * For food mode, the app needs either:
             * - selected serving ID, e.g. 1 bowl
             * - custom total grams, e.g. 180g
             */
            if (! $this->filled('food_serving_id') && ! $this->filled('total_grams')) {
                $validator->errors()->add(
                    'total_grams',
                    'Total grams is required when no serving is selected.'
                );
            }
        });
    }
}