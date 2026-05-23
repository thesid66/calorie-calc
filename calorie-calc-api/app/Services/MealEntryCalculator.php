<?php

namespace App\Services;

use App\Models\Food;
use App\Models\FoodServing;
use InvalidArgumentException;

class MealEntryCalculator
{
    /**
     * Calculates actual nutrition totals from a food record.
     *
     * The food database stores nutrients per 100g.
     * Meal logs need actual consumed totals.
     */
    public function calculateFromFood(
        Food $food,
        ?FoodServing $serving,
        float $quantity,
        ?float $totalGrams
    ): array {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Quantity must be greater than zero.');
        }

        if ($serving) {
            $servingGrams = (float) $serving->grams;
            $calculatedTotalGrams = $servingGrams * $quantity;

            return $this->calculateTotals(
                food: $food,
                quantity: $quantity,
                servingLabel: $serving->label,
                servingGrams: $servingGrams,
                totalGrams: $calculatedTotalGrams
            );
        }

        if ($totalGrams === null || $totalGrams <= 0) {
            throw new InvalidArgumentException(
                'Total grams is required when no serving is selected.'
            );
        }

        return $this->calculateTotals(
            food: $food,
            quantity: $quantity,
            servingLabel: 'Custom grams',
            servingGrams: null,
            totalGrams: $totalGrams
        );
    }

    private function calculateTotals(
        Food $food,
        float $quantity,
        string $servingLabel,
        ?float $servingGrams,
        float $totalGrams
    ): array {
        $factor = $totalGrams / 100;

        return [
            'food_name_snapshot' => $food->name,
            'quantity' => round($quantity, 2),
            'serving_label' => $servingLabel,
            'serving_grams' => $servingGrams,
            'total_grams' => round($totalGrams, 2),

            'calories' => round((float) $food->calories_per_100g * $factor, 2),
            'protein_g' => round((float) $food->protein_per_100g * $factor, 2),
            'carbs_g' => round((float) $food->carbs_per_100g * $factor, 2),
            'fat_g' => round((float) $food->fat_per_100g * $factor, 2),

            'fiber_g' => $food->fiber_per_100g !== null
                ? round((float) $food->fiber_per_100g * $factor, 2)
                : null,

            'sugar_g' => $food->sugar_per_100g !== null
                ? round((float) $food->sugar_per_100g * $factor, 2)
                : null,

            'sodium_mg' => $food->sodium_mg_per_100g !== null
                ? round((float) $food->sodium_mg_per_100g * $factor, 2)
                : null,
        ];
    }

    /**
     * Manual mode is for quick meal logging.
     *
     * Example:
     * User does not know exact grams but knows they ate around 650 calories.
     * We still store it as a proper meal entry.
     */
    public function calculateFromManualEntry(array $validated): array
    {
        return [
            'food_name_snapshot' => trim($validated['manual_food_name']),
            'quantity' => isset($validated['quantity'])
                ? round((float) $validated['quantity'], 2)
                : 1,

            'serving_label' => $validated['serving_label'] ?? 'Manual entry',
            'serving_grams' => null,
            'total_grams' => isset($validated['total_grams'])
                ? round((float) $validated['total_grams'], 2)
                : null,

            'calories' => round((float) $validated['calories'], 2),
            'protein_g' => round((float) ($validated['protein_g'] ?? 0), 2),
            'carbs_g' => round((float) ($validated['carbs_g'] ?? 0), 2),
            'fat_g' => round((float) ($validated['fat_g'] ?? 0), 2),
            'fiber_g' => isset($validated['fiber_g'])
                ? round((float) $validated['fiber_g'], 2)
                : null,
            'sugar_g' => isset($validated['sugar_g'])
                ? round((float) $validated['sugar_g'], 2)
                : null,
            'sodium_mg' => isset($validated['sodium_mg'])
                ? round((float) $validated['sodium_mg'], 2)
                : null,
        ];
    }
}