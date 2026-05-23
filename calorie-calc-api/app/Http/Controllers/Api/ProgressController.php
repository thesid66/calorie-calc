<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MealEntry;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProgressController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        [$from, $to] = $this->validatedDateRange($request);

        $user = $request->user()->load(['profile', 'activeNutritionGoal']);

        $latestWeightLog = $user->weightLogs()
            ->orderByDesc('logged_on')
            ->orderByDesc('created_at')
            ->first();

        $firstWeightLogInRange = $user->weightLogs()
            ->whereBetween('logged_on', [$from, $to])
            ->orderBy('logged_on')
            ->first();

        $lastWeightLogInRange = $user->weightLogs()
            ->whereBetween('logged_on', [$from, $to])
            ->orderByDesc('logged_on')
            ->first();

        $nutritionTotals = $user->mealEntries()
            ->whereBetween('logged_for_date', [$from, $to])
            ->selectRaw('
                COALESCE(SUM(calories), 0) as calories,
                COALESCE(SUM(protein_g), 0) as protein_g,
                COALESCE(SUM(carbs_g), 0) as carbs_g,
                COALESCE(SUM(fat_g), 0) as fat_g,
                COALESCE(SUM(fiber_g), 0) as fiber_g,
                COALESCE(SUM(sugar_g), 0) as sugar_g,
                COALESCE(SUM(sodium_mg), 0) as sodium_mg
            ')
            ->first();

        $daysInRange = Carbon::parse($from)->diffInDays(Carbon::parse($to)) + 1;

        $profile = $user->profile;
        $activeGoal = $user->activeNutritionGoal;

        $currentWeight = $latestWeightLog
            ? (float) $latestWeightLog->weight_kg
            : ($profile?->current_weight_kg !== null ? (float) $profile->current_weight_kg : null);

        $startingWeight = $profile?->starting_weight_kg !== null
            ? (float) $profile->starting_weight_kg
            : null;

        $targetWeight = $profile?->target_weight_kg !== null
            ? (float) $profile->target_weight_kg
            : null;

        return ApiResponse::success([
            'range' => [
                'from' => $from,
                'to' => $to,
                'days' => $daysInRange,
            ],

            'weight' => [
                'starting_weight_kg' => $startingWeight,
                'current_weight_kg' => $currentWeight,
                'target_weight_kg' => $targetWeight,
                'latest_logged_on' => $latestWeightLog?->logged_on?->toDateString(),

                'change_in_range_kg' => $this->calculateWeightChange(
                    $firstWeightLogInRange?->weight_kg,
                    $lastWeightLogInRange?->weight_kg
                ),

                'overall_change_kg' => $this->calculateWeightChange(
                    $startingWeight,
                    $currentWeight
                ),

                'progress_to_target_percent' => $this->calculateProgressToTarget(
                    startingWeight: $startingWeight,
                    currentWeight: $currentWeight,
                    targetWeight: $targetWeight
                ),
            ],

            'nutrition' => [
                'total' => [
                    'calories' => round((float) $nutritionTotals->calories, 2),
                    'protein_g' => round((float) $nutritionTotals->protein_g, 2),
                    'carbs_g' => round((float) $nutritionTotals->carbs_g, 2),
                    'fat_g' => round((float) $nutritionTotals->fat_g, 2),
                    'fiber_g' => round((float) $nutritionTotals->fiber_g, 2),
                    'sugar_g' => round((float) $nutritionTotals->sugar_g, 2),
                    'sodium_mg' => round((float) $nutritionTotals->sodium_mg, 2),
                ],
                'daily_average' => [
                    'calories' => round((float) $nutritionTotals->calories / $daysInRange, 2),
                    'protein_g' => round((float) $nutritionTotals->protein_g / $daysInRange, 2),
                    'carbs_g' => round((float) $nutritionTotals->carbs_g / $daysInRange, 2),
                    'fat_g' => round((float) $nutritionTotals->fat_g / $daysInRange, 2),
                ],
            ],

            'goal' => $activeGoal ? [
                'goal_type' => $activeGoal->goal_type,
                'daily_calorie_target' => $activeGoal->daily_calorie_target,
                'protein_target_g' => $activeGoal->protein_target_g,
                'carb_target_g' => $activeGoal->carb_target_g,
                'fat_target_g' => $activeGoal->fat_target_g,
            ] : null,
        ]);
    }

    public function weight(Request $request): JsonResponse
    {
        [$from, $to] = $this->validatedDateRange($request);

        $logs = $request->user()
            ->weightLogs()
            ->whereBetween('logged_on', [$from, $to])
            ->orderBy('logged_on')
            ->get();

        $series = $logs->map(function ($log) {
            return [
                'date' => $log->logged_on?->toDateString(),
                'weight_kg' => (float) $log->weight_kg,
                'notes' => $log->notes,
            ];
        })->values();

        return ApiResponse::success([
            'from' => $from,
            'to' => $to,
            'series' => $series,
        ]);
    }

    public function nutrition(Request $request): JsonResponse
    {
        [$from, $to] = $this->validatedDateRange($request);

        $user = $request->user();

        $rows = $user->mealEntries()
            ->whereBetween('logged_for_date', [$from, $to])
            ->selectRaw('
                logged_for_date,
                COALESCE(SUM(calories), 0) as calories,
                COALESCE(SUM(protein_g), 0) as protein_g,
                COALESCE(SUM(carbs_g), 0) as carbs_g,
                COALESCE(SUM(fat_g), 0) as fat_g,
                COALESCE(SUM(fiber_g), 0) as fiber_g,
                COALESCE(SUM(sugar_g), 0) as sugar_g,
                COALESCE(SUM(sodium_mg), 0) as sodium_mg
            ')
            ->groupBy('logged_for_date')
            ->orderBy('logged_for_date')
            ->get()
            ->keyBy(fn ($row) => Carbon::parse($row->logged_for_date)->toDateString());

        $series = [];
        $cursor = Carbon::parse($from);
        $end = Carbon::parse($to);

        /**
         * We return every date in the range, even if there were no meals.
         * This makes chart rendering easier in the Expo app.
         */
        while ($cursor->lte($end)) {
            $date = $cursor->toDateString();
            $row = $rows->get($date);

            $series[] = [
                'date' => $date,
                'calories' => $row ? round((float) $row->calories, 2) : 0,
                'protein_g' => $row ? round((float) $row->protein_g, 2) : 0,
                'carbs_g' => $row ? round((float) $row->carbs_g, 2) : 0,
                'fat_g' => $row ? round((float) $row->fat_g, 2) : 0,
                'fiber_g' => $row ? round((float) $row->fiber_g, 2) : 0,
                'sugar_g' => $row ? round((float) $row->sugar_g, 2) : 0,
                'sodium_mg' => $row ? round((float) $row->sodium_mg, 2) : 0,
            ];

            $cursor->addDay();
        }

        return ApiResponse::success([
            'from' => $from,
            'to' => $to,
            'series' => $series,
        ]);
    }

    private function validatedDateRange(Request $request): array
    {
        $validator = Validator::make($request->query(), [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        if ($validator->fails()) {
            abort(response()->json([
                'success' => false,
                'message' => 'Invalid date range.',
                'errors' => $validator->errors(),
            ], 422));
        }

        $from = $request->query('from', now()->subDays(29)->toDateString());
        $to = $request->query('to', now()->toDateString());

        $days = Carbon::parse($from)->diffInDays(Carbon::parse($to)) + 1;

        if ($days > 366) {
            abort(response()->json([
                'success' => false,
                'message' => 'Date range cannot be more than 366 days.',
                'errors' => [
                    'from' => ['Please choose a smaller date range.'],
                ],
            ], 422));
        }

        return [$from, $to];
    }

    private function calculateWeightChange(mixed $fromWeight, mixed $toWeight): ?float
    {
        if ($fromWeight === null || $toWeight === null) {
            return null;
        }

        return round((float) $toWeight - (float) $fromWeight, 2);
    }

    private function calculateProgressToTarget(
        ?float $startingWeight,
        ?float $currentWeight,
        ?float $targetWeight
    ): ?float {
        if ($startingWeight === null || $currentWeight === null || $targetWeight === null) {
            return null;
        }

        if ($startingWeight === $targetWeight) {
            return null;
        }

        /**
         * Works for both losing and gaining:
         *
         * Lose:
         * start 80, current 75, target 70
         * progress = (80 - 75) / (80 - 70)
         *
         * Gain:
         * start 60, current 65, target 70
         * progress = (65 - 60) / (70 - 60)
         */
        $progress = ($currentWeight - $startingWeight) / ($targetWeight - $startingWeight);

        return round(max(0, min(100, $progress * 100)), 2);
    }
}