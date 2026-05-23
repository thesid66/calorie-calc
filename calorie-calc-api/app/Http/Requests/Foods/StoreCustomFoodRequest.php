<?php

namespace App\Http\Requests\Foods;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomFoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * This request allows users to create their own foods.
     * We keep nutrient values strict to prevent impossible data like
     * 500g protein per 100g food.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:180'],
            'nepali_name' => ['nullable', 'string', 'max:180'],
            'brand' => ['nullable', 'string', 'max:180'],

            'barcode' => ['nullable', 'string', 'max:80', 'unique:foods,barcode'],

            'food_type' => [
                'nullable',
                Rule::in(['generic', 'recipe', 'packaged', 'restaurant', 'custom']),
            ],

            'cuisine' => ['nullable', 'string', 'max:80'],

            'calories_per_100g' => ['required', 'numeric', 'min:0', 'max:1000'],
            'protein_per_100g' => ['required', 'numeric', 'min:0', 'max:100'],
            'carbs_per_100g' => ['required', 'numeric', 'min:0', 'max:100'],
            'fat_per_100g' => ['required', 'numeric', 'min:0', 'max:100'],

            'fiber_per_100g' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sugar_per_100g' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'sodium_mg_per_100g' => ['nullable', 'numeric', 'min:0', 'max:10000'],

            'is_public' => ['nullable', 'boolean'],

            'servings' => ['nullable', 'array', 'max:10'],
            'servings.*.label' => ['required_with:servings', 'string', 'max:80'],
            'servings.*.grams' => ['required_with:servings', 'numeric', 'min:1', 'max:2000'],
            'servings.*.is_default' => ['nullable', 'boolean'],

            'aliases' => ['nullable', 'array', 'max:20'],
            'aliases.*.alias' => ['required_with:aliases', 'string', 'max:180'],
            'aliases.*.locale' => ['nullable', 'string', 'max:20'],
        ];
    }
}