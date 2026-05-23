<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'name' => $this->name,
            'nepali_name' => $this->nepali_name,
            'brand' => $this->brand,
            'barcode' => $this->barcode,

            'source' => $this->source,
            'food_type' => $this->food_type,
            'cuisine' => $this->cuisine,

            'nutrition_per_100g' => [
                'calories' => (float) $this->calories_per_100g,
                'protein_g' => (float) $this->protein_per_100g,
                'carbs_g' => (float) $this->carbs_per_100g,
                'fat_g' => (float) $this->fat_per_100g,
                'fiber_g' => $this->fiber_per_100g !== null
                    ? (float) $this->fiber_per_100g
                    : null,
                'sugar_g' => $this->sugar_per_100g !== null
                    ? (float) $this->sugar_per_100g
                    : null,
                'sodium_mg' => $this->sodium_mg_per_100g !== null
                    ? (float) $this->sodium_mg_per_100g
                    : null,
            ],

            'is_verified' => $this->is_verified,
            'is_public' => $this->is_public,
            'is_custom' => $this->created_by_user_id !== null,

            'servings' => FoodServingResource::collection(
                $this->whenLoaded('servings')
            ),

            'aliases' => FoodAliasResource::collection(
                $this->whenLoaded('aliases')
            ),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}