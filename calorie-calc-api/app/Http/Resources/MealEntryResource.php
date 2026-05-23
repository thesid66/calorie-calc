<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MealEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'food_id' => $this->food_id,
            'logged_for_date' => $this->logged_for_date?->toDateString(),
            'meal_type' => $this->meal_type,

            'food_name' => $this->food_name_snapshot,

            'quantity' => (float) $this->quantity,
            'serving_label' => $this->serving_label,
            'serving_grams' => $this->serving_grams !== null
                ? (float) $this->serving_grams
                : null,
            'total_grams' => $this->total_grams !== null
                ? (float) $this->total_grams
                : null,

            'nutrition' => [
                'calories' => (float) $this->calories,
                'protein_g' => (float) $this->protein_g,
                'carbs_g' => (float) $this->carbs_g,
                'fat_g' => (float) $this->fat_g,
                'fiber_g' => $this->fiber_g !== null ? (float) $this->fiber_g : null,
                'sugar_g' => $this->sugar_g !== null ? (float) $this->sugar_g : null,
                'sodium_mg' => $this->sodium_mg !== null ? (float) $this->sodium_mg : null,
            ],

            'notes' => $this->notes,

            'food' => new FoodResource($this->whenLoaded('food')),

            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}