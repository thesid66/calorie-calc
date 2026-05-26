<?php

namespace App\Filament\Widgets;

use App\Models\Food;
use App\Models\MealEntry;
use App\Models\User;
use App\Models\WeightLog;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class AdminOverviewStats extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected int|string|array $columnSpan = '1';

    protected function getColumns(): int
    {
        return 2;
    }

    protected function getStats(): array
    {
        return [
            Stat::make('Total users', number_format(User::query()->count()))
                ->description('Registered app users'),

            Stat::make('Admin users', number_format(User::query()->where('is_admin', true)->count()))
                ->description('Users with admin panel access'),

            Stat::make('Total foods', number_format(Food::query()->count()))
                ->description('System, user and imported foods'),

            Stat::make('Unverified foods', number_format(Food::query()->where('is_verified', false)->count()))
                ->description('Foods waiting for admin review'),

            Stat::make('Meal entries today', number_format(
                MealEntry::query()
                    ->whereDate('logged_for_date', now()->toDateString())
                    ->count()
            ))
                ->description('Diary logs created for today'),

            Stat::make('Meal entries last 7 days', number_format(
                MealEntry::query()
                    ->whereDate('logged_for_date', '>=', now()->subDays(7)->toDateString())
                    ->count()
            ))
                ->description('Recent food logging activity'),

            Stat::make('Weight logs today', number_format(
                WeightLog::query()
                    ->whereDate('logged_on', now()->toDateString())
                    ->count()
            ))
                ->description('Progress logs for today'),

            Stat::make('Weight logs last 7 days', number_format(
                WeightLog::query()
                    ->whereDate('logged_on', '>=', now()->subDays(7)->toDateString())
                    ->count()
            ))
                ->description('Recent progress tracking'),
        ];
    }
}