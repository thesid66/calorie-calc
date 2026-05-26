<?php

namespace App\Filament\Widgets;

use App\Models\Food;
use Filament\Widgets\ChartWidget;
use Illuminate\Database\Eloquent\Builder;

class FoodCultureBreakdownChart extends ChartWidget
{
    protected ?string $heading = 'Nepali vs Other Foods';

    protected static ?int $sort = 6;

    protected int|string|array $columnSpan = '1';

    protected ?string $maxHeight = '240px';

    protected ?array $options = [
        'plugins' => [
            'legend' => [
                'position' => 'bottom',
            ],
        ],
    ];



    protected function getData(): array
    {
        $totalFoods = Food::query()->count();

        $nepaliFoods = $this->nepaliFoodsQuery()->count();

        $otherFoods = max($totalFoods - $nepaliFoods, 0);

        return [
            'datasets' => [
                [
                    'label' => 'Foods',
                    'data' => [
                        $nepaliFoods,
                        $otherFoods,
                    ],
                    'backgroundColor' => [
                        '#f59e0b',
                        '#64748b',
                    ],
                    'borderColor' => [
                        '#d97706',
                        '#475569',
                    ],
                ],
            ],
            'labels' => [
                'Nepali foods',
                'Other foods',
            ],
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
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