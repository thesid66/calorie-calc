<?php

namespace App\Filament\Widgets;

use App\Models\MealEntry;
use Filament\Widgets\ChartWidget;

class MealLoggingQualityChart extends ChartWidget
{
    protected ?string $heading = 'Manual vs Database Food Logging';

    protected static ?int $sort = 9;

    protected int|string|array $columnSpan = 'full';

    protected ?string $maxHeight = '320px';

    public function getDescription(): ?string
    {
        return 'Shows whether users are finding foods in the database or relying on manual food entries.';
    }

    protected function getData(): array
    {
        $databaseEntries = MealEntry::query()
            ->whereNotNull('food_id')
            ->count();

        $manualEntries = MealEntry::query()
            ->whereNull('food_id')
            ->count();

        return [
            'datasets' => [
                [
                    'label' => 'Meal entries',
                    'data' => [
                        $databaseEntries,
                        $manualEntries,
                    ],
                    'backgroundColor' => [
                        '#22c55e',
                        '#f97316',
                    ],
                    'borderColor' => [
                        '#16a34a',
                        '#ea580c',
                    ],
                ],
            ],
            'labels' => [
                'Database food logs',
                'Manual food logs',
            ],
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }
}