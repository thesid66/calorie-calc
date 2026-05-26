<?php

namespace App\Filament\Widgets;

use App\Models\Food;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Database\Eloquent\Builder;

class FoodCultureStats extends StatsOverviewWidget
{
    protected static ?int $sort = 5;

    protected function getStats(): array
    {
        $totalFoods = Food::query()->count();

        $nepaliFoods = $this->nepaliFoodsQuery()->count();

        $otherFoods = max($totalFoods - $nepaliFoods, 0);

        $nepaliFoodShare = $totalFoods > 0
            ? round(($nepaliFoods / $totalFoods) * 100, 1)
            : 0;

        $unverifiedNepaliFoods = $this->nepaliFoodsQuery()
            ->where('is_verified', false)
            ->count();

        return [
            Stat::make('Nepali foods', number_format($nepaliFoods))
                ->description('Foods marked as Nepali or having Nepali names'),

            Stat::make('Other foods', number_format($otherFoods))
                ->description('Foods outside the Nepali food group'),

            Stat::make('Nepali food share', $nepaliFoodShare.'%')
                ->description('Percentage of total food database'),

            Stat::make('Unverified Nepali foods', number_format($unverifiedNepaliFoods))
                ->description('Nepali foods waiting for admin review'),
        ];
    }

    private function nepaliFoodsQuery(): Builder
    {
        return Food::query()
            ->where(function (Builder $query): void {
                $query
                    ->whereRaw('LOWER(cuisine) = ?', ['nepali'])
                    ->orWhere(function (Builder $query): void {
                        $query
                            ->whereNotNull('nepali_name')
                            ->where('nepali_name', '!=', '');
                    });
            });
    }
}