<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;

class DashboardPlatformOverviewLabel extends Widget
{
    protected string $view = 'filament.widgets.dashboard-section-label';

    protected static ?int $sort = 0;

    protected int|string|array $columnSpan = 'full';

    public string $eyebrow = 'Overview';

    public string $title = 'Platform Overview';

    public ?string $description = 'Quick summary of users, foods, diary activity, and progress tracking.';
}