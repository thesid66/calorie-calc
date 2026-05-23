<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * We keep this strict because wrong height/weight/date values will create
     * wrong calorie recommendations.
     */
    public function rules(): array
    {
        return [
            'date_of_birth' => ['required', 'date', 'before_or_equal:-13 years'],
            'sex_for_formula' => ['required', 'in:male,female'],

            'height_cm' => ['required', 'numeric', 'min:80', 'max:250'],
            'starting_weight_kg' => ['required', 'numeric', 'min:20', 'max:400'],
            'current_weight_kg' => ['required', 'numeric', 'min:20', 'max:400'],
            'target_weight_kg' => ['nullable', 'numeric', 'min:20', 'max:400'],

            'unit_system' => ['required', 'in:metric,imperial'],
        ];
    }
}