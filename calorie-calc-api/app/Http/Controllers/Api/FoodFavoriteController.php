<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FoodResource;
use App\Models\Food;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodFavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $foods = $request->user()
            ->favoriteFoods()
            ->with(['servings', 'aliases'])
            ->orderByPivot('created_at', 'desc')
            ->get();

        return ApiResponse::success([
            'foods' => FoodResource::collection($foods),
            'food_ids' => $foods->pluck('id')->values(),
        ]);
    }

    public function store(Request $request, Food $food): JsonResponse
    {
        $visibleFood = Food::query()
            ->visibleToUser($request->user())
            ->whereKey($food->id)
            ->first();

        if (! $visibleFood) {
            abort(404);
        }

        $request->user()->favoriteFoods()->syncWithoutDetaching([
            $visibleFood->id,
        ]);

        $visibleFood->load(['servings', 'aliases']);

        return ApiResponse::success([
            'food' => new FoodResource($visibleFood),
        ], 'Food added to favourites.');
    }

    public function destroy(Request $request, Food $food): JsonResponse
    {
        $request->user()->favoriteFoods()->detach($food->id);

        return ApiResponse::success(null, 'Food removed from favourites.');
    }
}