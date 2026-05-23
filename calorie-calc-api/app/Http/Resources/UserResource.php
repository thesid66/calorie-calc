<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,

            'has_profile' => $this->whenLoaded(
                'profile',
                fn () => $this->profile !== null,
                $this->profile()->exists()
            ),

            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}