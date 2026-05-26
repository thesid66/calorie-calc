<?php

namespace App\Filament\Widgets;

use App\Models\MealEntry;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Support\Facades\DB;

class TopLoggedFoodsTable extends TableWidget
{
    protected static ?int $sort = 11;

    protected int|string|array $columnSpan = 1;

    public function table(Table $table): Table
    {
        return $table
            ->heading('Top Logged Foods')
            ->description('Most frequently logged foods across all users.')
            ->query($this->topLoggedFoodsQuery())
            ->paginated(false)
            ->columns([
                TextColumn::make('food_name_snapshot')
                    ->label('Food')
                    ->weight('semibold')
                    ->searchable(),

                TextColumn::make('logs_count')
                    ->label('Logs')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((int) $state)),

                TextColumn::make('users_count')
                    ->label('Users')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((int) $state)),

                TextColumn::make('last_logged_on')
                    ->label('Last logged')
                    ->date()
                    ->sortable(),

                TextColumn::make('average_calories')
                    ->label('Avg calories')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 0).' kcal')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('total_calories')
                    ->label('Total calories')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 0).' kcal')
                    ->toggleable(isToggledHiddenByDefault: true),
            ]);
    }

    private function topLoggedFoodsQuery()
    {
        $topLoggedFoods = DB::table('meal_entries')
            ->selectRaw('MIN(id) as id')
            ->selectRaw('food_name_snapshot')
            ->selectRaw('COUNT(*) as logs_count')
            ->selectRaw('COUNT(DISTINCT user_id) as users_count')
            ->selectRaw('AVG(calories) as average_calories')
            ->selectRaw('SUM(calories) as total_calories')
            ->selectRaw('MAX(logged_for_date) as last_logged_on')
            ->groupBy('food_name_snapshot');

        return MealEntry::query()
            ->fromSub($topLoggedFoods, 'meal_entries')
            ->select('meal_entries.*')
            ->orderByDesc('logs_count')
            ->limit(10);
    }
}