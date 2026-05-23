<?php

namespace App\Http\Requests\WeightLogs;

use Illuminate\Foundation\Http\FormRequest;

class StoreWeightLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Users should only log realistic body weights.
     * We prevent future dates because progress charts should reflect actual history.
     */
    public function rules(): array
    {
        return [
            'logged_on' => ['required', 'date', 'before_or_equal:today'],
            'weight_kg' => ['required', 'numeric', 'min:20', 'max:400'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}