<?php

namespace App\Filament\Widgets;

use App\Models\User;
use Carbon\CarbonPeriod;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class UserGrowthChart extends ChartWidget
{
    protected ?string $heading = 'User Growth';

    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 'full';

    public ?string $filter = 'this_month';

    public function getDescription(): ?string
    {
        return 'New user registrations over time, filterable by week, month, year, or all time.';
    }

    protected function getFilters(): ?array
    {
        return [
            'this_week' => 'This week',
            'this_month' => 'This month',
            'this_year' => 'This year',
            'all' => 'All',
        ];
    }

    protected function getData(): array
    {
        $filter = $this->filter ?? 'this_month';

        [$labels, $data] = match ($filter) {
            'this_week' => $this->getDailyUserGrowth(
                now()->startOfWeek(),
                now(),
                'D d M'
            ),

            'this_month' => $this->getDailyUserGrowth(
                now()->startOfMonth(),
                now(),
                'd M'
            ),

            'this_year' => $this->getMonthlyUserGrowth(
                now()->startOfYear(),
                now(),
                'M'
            ),

            'all' => $this->getAllTimeUserGrowth(),

            default => $this->getDailyUserGrowth(
                now()->startOfMonth(),
                now(),
                'd M'
            ),
        };

        return [
            'datasets' => [
                [
                    'label' => 'New users',
                    'data' => $data,
                    'tension' => 0.35,
                    'fill' => true,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }

    private function getDailyUserGrowth(Carbon $startDate, Carbon $endDate, string $labelFormat): array
    {
        $startDate = $startDate->copy()->startOfDay();
        $endDate = $endDate->copy()->endOfDay();

        $users = User::query()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get(['created_at'])
            ->groupBy(fn (User $user): string => $user->created_at->format('Y-m-d'))
            ->map
            ->count();

        $labels = [];
        $data = [];

        foreach (CarbonPeriod::create($startDate, '1 day', $endDate) as $date) {
            $key = $date->format('Y-m-d');

            $labels[] = $date->format($labelFormat);
            $data[] = $users->get($key, 0);
        }

        return [$labels, $data];
    }

    private function getMonthlyUserGrowth(Carbon $startDate, Carbon $endDate, string $labelFormat): array
    {
        $startDate = $startDate->copy()->startOfMonth();
        $endDate = $endDate->copy()->startOfMonth();

        $users = User::query()
            ->whereBetween('created_at', [
                $startDate->copy()->startOfDay(),
                $endDate->copy()->endOfMonth(),
            ])
            ->get(['created_at'])
            ->groupBy(fn (User $user): string => $user->created_at->format('Y-m'))
            ->map
            ->count();

        $labels = [];
        $data = [];

        foreach (CarbonPeriod::create($startDate, '1 month', $endDate) as $date) {
            $key = $date->format('Y-m');

            $labels[] = $date->format($labelFormat);
            $data[] = $users->get($key, 0);
        }

        return [$labels, $data];
    }

    private function getAllTimeUserGrowth(): array
    {
        $firstUserCreatedAt = User::query()->min('created_at');

        if (! $firstUserCreatedAt) {
            return [
                [now()->format('M Y')],
                [0],
            ];
        }

        $startDate = Carbon::parse($firstUserCreatedAt)->startOfMonth();

        return $this->getMonthlyUserGrowth(
            $startDate,
            now(),
            'M Y'
        );
    }
}