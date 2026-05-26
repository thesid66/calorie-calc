<?php

namespace App\Filament\Widgets;

use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TopLoggedFoodsBarChart extends ChartWidget
{
    protected ?string $heading = 'Top Logged Foods Chart';

    protected static ?int $sort = 10;

    protected int|string|array $columnSpan = 1;

    protected ?string $maxHeight = '240px';

    protected ?array $options = [
        'plugins' => [
            'legend' => [
                'display' => false,
            ],
        ],
        'scales' => [
            'y' => [
                'beginAtZero' => true,
            ],
        ],
    ];


    protected function getData(): array
    {
        $foods = DB::table('meal_entries')
            ->selectRaw('food_name_snapshot')
            ->selectRaw('COUNT(*) as logs_count')
            ->groupBy('food_name_snapshot')
            ->orderByDesc('logs_count')
            ->limit(10)
            ->get();

        if ($foods->isEmpty()) {
            return [
                'datasets' => [
                    [
                        'label' => 'Logs',
                        'data' => [0],
                    ],
                ],
                'labels' => ['No data'],
            ];
        }

        return [
            'datasets' => [
                [
                    'label' => 'Logs',
                    'data' => $foods
                        ->pluck('logs_count')
                        ->map(fn ($count): int => (int) $count)
                        ->values()
                        ->all(),
                    'backgroundColor' => '#f59e0b',
                    'borderColor' => '#d97706',
                ],
            ],
            'labels' => $foods
                ->pluck('food_name_snapshot')
                ->map(fn ($food): string => Str::limit((string) $food, 24))
                ->values()
                ->all(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }
}