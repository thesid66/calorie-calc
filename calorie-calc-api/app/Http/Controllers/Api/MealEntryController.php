<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meals\StoreMealEntryRequest;
use App\Http\Requests\Meals\UpdateMealEntryRequest;
use App\Http\Resources\MealEntryResource;
use App\Models\Food;
use App\Models\FoodServing;
use App\Models\MealEntry;
use App\Services\MealEntryCalculator;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MealEntryController extends Controller
{
    public function show(MealEntry $mealEntry): JsonResponse
    {
        $this->ensureUserOwnsMealEntry($mealEntry);

        $mealEntry->load('food.servings');

        return ApiResponse::success([
            'meal_entry' => new MealEntryResource($mealEntry),
        ]);
    }

    public function store(
        StoreMealEntryRequest $request,
        MealEntryCalculator $calculator
    ): JsonResponse {
        $user = $request->user();
        $validated = $request->validated();

        try {
            $calculated = $this->calculateEntryPayload($validated, $user->id, $calculator);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $mealEntry = DB::transaction(function () use ($user, $validated, $calculated) {
            return $user->mealEntries()->create([
                'food_id' => $validated['entry_mode'] === 'food'
                    ? $validated['food_id']
                    : null,

                'logged_for_date' => $validated['logged_for_date'],
                'meal_type' => $validated['meal_type'],

                ...$calculated,

                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $mealEntry->load('food');

        return ApiResponse::success([
            'meal_entry' => new MealEntryResource($mealEntry),
        ], 'Meal entry added successfully.', 201);
    }

    public function update(
        UpdateMealEntryRequest $request,
        MealEntry $mealEntry,
        MealEntryCalculator $calculator
    ): JsonResponse {
        $this->ensureUserOwnsMealEntry($mealEntry);

        $validated = $request->validated();

        try {
            $calculated = $this->calculateEntryPayload(
                validated: $validated,
                userId: $request->user()->id,
                calculator: $calculator
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $mealEntry->update([
            'food_id' => $validated['entry_mode'] === 'food'
                ? $validated['food_id']
                : null,

            'logged_for_date' => $validated['logged_for_date'],
            'meal_type' => $validated['meal_type'],

            ...$calculated,

            'notes' => $validated['notes'] ?? null,
        ]);

        $mealEntry->load('food');

        return ApiResponse::success([
            'meal_entry' => new MealEntryResource($mealEntry),
        ], 'Meal entry updated successfully.');
    }

    public function destroy(MealEntry $mealEntry): JsonResponse
    {
        $this->ensureUserOwnsMealEntry($mealEntry);

        $mealEntry->delete();

        return ApiResponse::success(null, 'Meal entry deleted successfully.');
    }

    private function calculateEntryPayload(
        array $validated,
        int $userId,
        MealEntryCalculator $calculator
    ): array {
        if ($validated['entry_mode'] === 'manual') {
            return $calculator->calculateFromManualEntry($validated);
        }

        $food = Food::query()
            ->visibleToUser(request()->user())
            ->find($validated['food_id']);

        if (! $food) {
            throw new InvalidArgumentException('Selected food was not found.');
        }

        $serving = null;

        if (! empty($validated['food_serving_id'])) {
            $serving = FoodServing::query()
                ->where('food_id', $food->id)
                ->find($validated['food_serving_id']);

            if (! $serving) {
                throw new InvalidArgumentException(
                    'Selected serving does not belong to this food.'
                );
            }
        }

        return $calculator->calculateFromFood(
            food: $food,
            serving: $serving,
            quantity: isset($validated['quantity'])
            ? (float) $validated['quantity']
            : 1,
            totalGrams: isset($validated['total_grams'])
            ? (float) $validated['total_grams']
            : null
        );
    }

    private function ensureUserOwnsMealEntry(MealEntry $mealEntry): void
    {
        if ($mealEntry->user_id !== request()->user()->id) {
            abort(404);
        }
    }
}