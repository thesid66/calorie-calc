<?php

namespace App\Filament\Widgets;

use Filament\Widgets\Widget;

class DashboardMealLoggingLabel extends Widget
{
    protected string $view = 'filament.widgets.dashboard-section-label';

    protected static ?int $sort = 7;

    protected int|string|array $columnSpan = 'full';

    public string $eyebrow = 'Diary';

    public string $title = 'Meal Logging Insights';

    public ?string $description = 'Understand how users log food, which foods are popular, and where the database needs improvement.';
}