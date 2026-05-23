<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Foods\StoreCustomFoodRequest;
use App\Http\Resources\FoodResource;
use App\Models\Food;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FoodController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $foods = Food::query()
            ->visibleToUser($user)
            ->with([
                'servings' => fn ($query) => $query->orderByDesc('is_default')->orderBy('id'),
            ])
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->search((string) $request->query('search'));
            })
            ->when($request->filled('source'), function ($query) use ($request) {
                $query->where('source', $request->query('source'));
            })
            ->when($request->filled('cuisine'), function ($query) use ($request) {
                $query->whereRaw('LOWER(cuisine) = ?', [
                    mb_strtolower((string) $request->query('cuisine')),
                ]);
            })
            ->when($request->boolean('verified_only'), function ($query) {
                $query->where('is_verified', true);
            })
            ->orderByDesc('is_verified')
            ->orderBy('name')
            ->paginate(
                perPage: min((int) $request->query('per_page', 20), 50)
            );

        return ApiResponse::success([
            'foods' => FoodResource::collection($foods->items()),
            'pagination' => [
                'current_page' => $foods->currentPage(),
                'per_page' => $foods->perPage(),
                'total' => $foods->total(),
                'last_page' => $foods->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, Food $food): JsonResponse
    {
        $user = $request->user();

        $isVisible = $food->is_public || $food->created_by_user_id === $user->id;

        if (! $isVisible) {
            return ApiResponse::error('Food not found.', 404);
        }

        $food->load([
            'servings' => fn ($query) => $query->orderByDesc('is_default')->orderBy('id'),
            'aliases',
        ]);

        return ApiResponse::success([
            'food' => new FoodResource($food),
        ]);
    }

    public function storeCustom(StoreCustomFoodRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $food = DB::transaction(function () use ($user, $validated) {
            $food = Food::create([
                'created_by_user_id' => $user->id,
                'source' => Food::SOURCE_USER,
                'source_id' => null,

                'name' => trim($validated['name']),
                'nepali_name' => isset($validated['nepali_name'])
                    ? trim($validated['nepali_name'])
                    : null,
                'brand' => isset($validated['brand'])
                    ? trim($validated['brand'])
                    : null,
                'barcode' => $validated['barcode'] ?? null,

                'food_type' => $validated['food_type'] ?? 'custom',
                'cuisine' => isset($validated['cuisine'])
                    ? mb_strtolower(trim($validated['cuisine']))
                    : null,

                'calories_per_100g' => $validated['calories_per_100g'],
                'protein_per_100g' => $validated['protein_per_100g'],
                'carbs_per_100g' => $validated['carbs_per_100g'],
                'fat_per_100g' => $validated['fat_per_100g'],
                'fiber_per_100g' => $validated['fiber_per_100g'] ?? null,
                'sugar_per_100g' => $validated['sugar_per_100g'] ?? null,
                'sodium_mg_per_100g' => $validated['sodium_mg_per_100g'] ?? null,

                'is_verified' => false,
                'is_public' => $validated['is_public'] ?? false,
            ]);

            $servings = $validated['servings'] ?? [];

            if (count($servings) === 0) {
                $servings = [
                    [
                        'label' => '100 g',
                        'grams' => 100,
                        'is_default' => true,
                    ],
                ];
            }

            $hasDefaultServing = collect($servings)->contains(
                fn ($serving) => (bool) ($serving['is_default'] ?? false)
            );

            foreach ($servings as $index => $serving) {
                $food->servings()->create([
                    'label' => trim($serving['label']),
                    'grams' => $serving['grams'],
                    /**
                     * If user does not mark any default serving, the first one
                     * becomes default so the app always has a safe serving option.
                     */
                    'is_default' => $hasDefaultServing
                        ? (bool) ($serving['is_default'] ?? false)
                        : $index === 0,
                ]);
            }

            foreach ($validated['aliases'] ?? [] as $alias) {
                $food->aliases()->create([
                    'alias' => trim($alias['alias']),
                    'locale' => $alias['locale'] ?? null,
                ]);
            }

            return $food;
        });

        $food->load(['servings', 'aliases']);

        return ApiResponse::success([
            'food' => new FoodResource($food),
        ], 'Custom food created successfully.', 201);
    }
}