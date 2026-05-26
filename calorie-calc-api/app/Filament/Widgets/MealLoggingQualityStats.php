<?php

namespace App\Filament\Widgets;

use App\Models\MealEntry;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class MealLoggingQualityStats extends StatsOverviewWidget
{
    protected static ?int $sort = 4;

    protected function getStats(): array
    {
        $totalEntries = MealEntry::query()->count();

        $databaseEntries = MealEntry::query()
            ->whereNotNull('food_id')
            ->count();

        $manualEntries = MealEntry::query()
            ->whereNull('food_id')
            ->count();

        $manualRate = $totalEntries > 0
            ? round(($manualEntries / $totalEntries) * 100, 1)
            : 0;

        $last30DaysStart = now()->subDays(30)->toDateString();

        $last30DaysTotal = MealEntry::query()
            ->whereDate('logged_for_date', '>=', $last30DaysStart)
            ->count();

        $last30DaysManual = MealEntry::query()
            ->whereDate('logged_for_date', '>=', $last30DaysStart)
            ->whereNull('food_id')
            ->count();

        $last30DaysManualRate = $last30DaysTotal > 0
            ? round(($last30DaysManual / $last30DaysTotal) * 100, 1)
            : 0;

        return [
            Stat::make('Database food logs', number_format($databaseEntries))
                ->description('Meal entries linked to saved foods'),

            Stat::make('Manual food logs', number_format($manualEntries))
                ->description('Meal entries created without a linked food'),

            Stat::make('Manual log rate', $manualRate.'%')
                ->description('Overall percentage of manual logging'),

            Stat::make('Manual rate last 30 days', $last30DaysManualRate.'%')
                ->description('Recent manual logging trend'),
        ];
    }
}