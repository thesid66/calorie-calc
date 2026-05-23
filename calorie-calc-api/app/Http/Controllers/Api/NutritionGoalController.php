<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Goals\StoreNutritionGoalRequest;
use App\Http\Resources\NutritionGoalResource;
use App\Models\ActivityLevel;
use App\Services\CalorieGoalCalculator;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class NutritionGoalController extends Controller
{
    public function show(): JsonResponse
    {
        $goal = request()
            ->user()
            ->activeNutritionGoal()
            ->with('activityLevel')
            ->first();

        return ApiResponse::success([
            'active_goal' => $goal ? new NutritionGoalResource($goal) : null,
        ]);
    }

    public function store(
        StoreNutritionGoalRequest $request,
        CalorieGoalCalculator $calculator
    ): JsonResponse {
        $user = $request->user();
        $profile = $user->profile;

        if (! $profile) {
            return ApiResponse::error(
                'Please complete your profile before creating a nutrition goal.',
                422
            );
        }

        $validated = $request->validated();

        $activityLevel = ActivityLevel::query()
            ->where('is_active', true)
            ->findOrFail($validated['activity_level_id']);

        try {
            $calculated = $calculator->calculate(
                profile: $profile,
                activityLevel: $activityLevel,
                goalType: $validated['goal_type'],
                targetRateKgPerWeek: isset($validated['target_rate_kg_per_week'])
                ? (float) $validated['target_rate_kg_per_week']
                : null
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $goal = DB::transaction(function () use ($user, $activityLevel, $validated, $calculated) {
            /**
             * Only one active goal at a time.
             * Old goals are kept for future progress/history review.
             */
            $user->nutritionGoals()->update([
                'is_active' => false,
            ]);

            return $user->nutritionGoals()->create([
                'activity_level_id' => $activityLevel->id,
                'goal_type' => $validated['goal_type'],
                'target_rate_kg_per_week' => $validated['goal_type'] === 'maintain'
                    ? null
                    : $validated['target_rate_kg_per_week'],

                ...$calculated,

                'calculated_at' => now(),
                'is_active' => true,
            ]);
        });

        return ApiResponse::success([
            'active_goal' => new NutritionGoalResource($goal->load('activityLevel')),
        ], 'Nutrition goal calculated successfully.', 201);
    }
}