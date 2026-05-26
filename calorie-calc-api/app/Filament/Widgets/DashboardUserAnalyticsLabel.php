<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;

class DashboardUserAnalyticsLabel extends Widget
{
    protected string $view = 'filament.widgets.dashboard-section-label';

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    public string $eyebrow = 'Users';

    public string $title = 'User Analytics';

    public ?string $description = 'Track registration growth and user activity trends.';
}