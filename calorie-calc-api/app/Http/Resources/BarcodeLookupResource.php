<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BarcodeLookupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'barcode' => $this->barcode,
            'provider' => $this->provider,
            'status' => $this->status,
            'status_verbose' => $this->status_verbose,

            'product_name' => $this->product_name,
            'brand' => $this->brand,

            'mapped_product' => $this->mapped_product,

            'food_id' => $this->food_id,
            'food' => new FoodResource($this->whenLoaded('food')),

            'last_fetched_at' => $this->last_fetched_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}