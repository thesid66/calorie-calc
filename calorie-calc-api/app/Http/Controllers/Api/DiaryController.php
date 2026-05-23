<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MealEntryResource;
use App\Http\Resources\NutritionGoalResource;
use App\Models\MealEntry;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DiaryController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $validator = Validator::make($request->query(), [
            'date' => ['nullable', 'date'],
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Invalid diary date.', 422, $validator->errors());
        }

        $user = $request->user();
        $date = $request->query('date', now()->toDateString());

        $entries = $user->mealEntries()
            ->with('food')
            ->whereDate('logged_for_date', $date)
            ->orderByRaw("
                CASE meal_type
                    WHEN 'breakfast' THEN 1
                    WHEN 'lunch' THEN 2
                    WHEN 'dinner' THEN 3
                    WHEN 'snack' THEN 4
                    ELSE 5
                END
            ")
            ->orderBy('created_at')
            ->get();

        $meals = [
            MealEntry::MEAL_BREAKFAST => [],
            MealEntry::MEAL_LUNCH => [],
            MealEntry::MEAL_DINNER => [],
            MealEntry::MEAL_SNACK => [],
        ];

        foreach ($entries as $entry) {
            $meals[$entry->meal_type][] = new MealEntryResource($entry);
        }

        $summary = [
            'calories' => round((float) $entries->sum('calories'), 2),
            'protein_g' => round((float) $entries->sum('protein_g'), 2),
            'carbs_g' => round((float) $entries->sum('carbs_g'), 2),
            'fat_g' => round((float) $entries->sum('fat_g'), 2),
            'fiber_g' => round((float) $entries->sum('fiber_g'), 2),
            'sugar_g' => round((float) $entries->sum('sugar_g'), 2),
            'sodium_mg' => round((float) $entries->sum('sodium_mg'), 2),
        ];

        $activeGoal = $user
            ->activeNutritionGoal()
            ->with('activityLevel')
            ->first();

        $target = null;

        if ($activeGoal) {
            $target = [
                'daily_calorie_target' => $activeGoal->daily_calorie_target,
                'protein_target_g' => $activeGoal->protein_target_g,
                'carb_target_g' => $activeGoal->carb_target_g,
                'fat_target_g' => $activeGoal->fat_target_g,

                'remaining' => [
                    'calories' => round($activeGoal->daily_calorie_target - $summary['calories'], 2),
                    'protein_g' => round($activeGoal->protein_target_g - $summary['protein_g'], 2),
                    'carbs_g' => round($activeGoal->carb_target_g - $summary['carbs_g'], 2),
                    'fat_g' => round($activeGoal->fat_target_g - $summary['fat_g'], 2),
                ],
            ];
        }

        return ApiResponse::success([
            'date' => $date,
            'meals' => $meals,
            'summary' => $summary,
            'target' => $target,
            'active_goal' => $activeGoal
                ? new NutritionGoalResource($activeGoal)
                : null,
        ]);
    }
}