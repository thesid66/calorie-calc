<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;

class DashboardFoodDatabaseLabel extends Widget
{
    protected string $view = 'filament.widgets.dashboard-section-label';

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 'full';

    public string $eyebrow = 'Foods';

    public string $title = 'Food Database Insights';

    public ?string $description = 'Review Nepali food coverage, verification needs, and food database quality.';
}