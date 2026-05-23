<?php

namespace App\Services;

use App\Models\ActivityLevel;
use App\Models\UserProfile;
use Carbon\Carbon;
use InvalidArgumentException;

class CalorieGoalCalculator
{
    /**
     * Calories required to gain/lose roughly 1kg body weight.
     * This is an approximation, but useful for MVP goal planning.
     */
    private const KCAL_PER_KG_BODY_WEIGHT = 7700;

    /**
     * Uses Mifflin-St Jeor formula.
     *
     * Male:
     * 10 × weight + 6.25 × height - 5 × age + 5
     *
     * Female:
     * 10 × weight + 6.25 × height - 5 × age - 161
     */
    public function calculate(
        UserProfile $profile,
        ActivityLevel $activityLevel,
        string $goalType,
        ?float $targetRateKgPerWeek
    ): array {
        $age = Carbon::parse($profile->date_of_birth)->age;

        if ($age < 13) {
            throw new InvalidArgumentException('This app currently supports users aged 13 and above.');
        }

        $weightKg = (float) $profile->current_weight_kg;
        $heightCm = (float) $profile->height_cm;

        $bmr = $this->calculateBmr(
            sexForFormula: $profile->sex_for_formula,
            weightKg: $weightKg,
            heightCm: $heightCm,
            age: $age,
        );

        $tdee = (int) round($bmr * (float) $activityLevel->multiplier);

        $dailyCalorieTarget = $this->calculateDailyTarget(
            tdee: $tdee,
            goalType: $goalType,
            targetRateKgPerWeek: $targetRateKgPerWeek,
        );

        /**
         * Macro strategy for MVP:
         * - Protein: 1.8g per kg body weight
         * - Fat: 25% of total calories
         * - Carbs: remaining calories
         *
         * This is simple, practical, and easy to explain to users.
         */
        $proteinG = (int) round($weightKg * 1.8);

        $fatCalories = $dailyCalorieTarget * 0.25;
        $fatG = (int) round($fatCalories / 9);

        $proteinCalories = $proteinG * 4;
        $remainingCaloriesForCarbs = max(
            0,
            $dailyCalorieTarget - $proteinCalories - $fatCalories
        );

        $carbG = (int) round($remainingCaloriesForCarbs / 4);

        return [
            'bmr' => $bmr,
            'tdee' => $tdee,
            'daily_calorie_target' => $dailyCalorieTarget,
            'protein_target_g' => $proteinG,
            'carb_target_g' => $carbG,
            'fat_target_g' => $fatG,
        ];
    }

    private function calculateBmr(
        string $sexForFormula,
        float $weightKg,
        float $heightCm,
        int $age
    ): int {
        $base = (10 * $weightKg) + (6.25 * $heightCm) - (5 * $age);

        return match ($sexForFormula) {
            'male' => (int) round($base + 5),
            'female' => (int) round($base - 161),
            default => throw new InvalidArgumentException('Invalid formula sex value.'),
        };
    }

    private function calculateDailyTarget(
        int $tdee,
        string $goalType,
        ?float $targetRateKgPerWeek
    ): int {
        if ($goalType === 'maintain') {
            return $tdee;
        }

        if ($targetRateKgPerWeek === null || $targetRateKgPerWeek <= 0) {
            throw new InvalidArgumentException('Target rate is required for lose or gain goal.');
        }

        if ($targetRateKgPerWeek > 1) {
            throw new InvalidArgumentException('Target rate cannot be more than 1kg per week.');
        }

        $dailyAdjustment = (int) round(
            ($targetRateKgPerWeek * self::KCAL_PER_KG_BODY_WEIGHT) / 7
        );

        return match ($goalType) {
            'lose' => max(1200, $tdee - $dailyAdjustment),
            'gain' => $tdee + $dailyAdjustment,
            default => throw new InvalidArgumentException('Invalid goal type.'),
        };
    }
}