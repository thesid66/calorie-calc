<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NutritionGoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'goal_type' => $this->goal_type,
            'target_rate_kg_per_week' => $this->target_rate_kg_per_week !== null
                ? (float) $this->target_rate_kg_per_week
                : null,

            'bmr' => $this->bmr,
            'tdee' => $this->tdee,
            'daily_calorie_target' => $this->daily_calorie_target,

            'protein_target_g' => $this->protein_target_g,
            'carb_target_g' => $this->carb_target_g,
            'fat_target_g' => $this->fat_target_g,

            'activity_level' => new ActivityLevelResource($this->whenLoaded('activityLevel')),

            'calculated_at' => $this->calculated_at?->toISOString(),
            'is_active' => $this->is_active,
        ];
    }
}