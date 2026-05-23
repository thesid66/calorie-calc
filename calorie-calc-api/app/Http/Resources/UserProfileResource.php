<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'sex_for_formula' => $this->sex_for_formula,
            'height_cm' => (float) $this->height_cm,
            'starting_weight_kg' => (float) $this->starting_weight_kg,
            'current_weight_kg' => (float) $this->current_weight_kg,
            'target_weight_kg' => $this->target_weight_kg !== null
                ? (float) $this->target_weight_kg
                : null,
            'unit_system' => $this->unit_system,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}