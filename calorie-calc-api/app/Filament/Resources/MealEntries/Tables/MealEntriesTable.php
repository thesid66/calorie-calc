<?php

namespace App\Filament\Resources\MealEntries\Tables;

use App\Models\MealEntry;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class MealEntriesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('logged_for_date', 'desc')
            ->columns([
                TextColumn::make('logged_for_date')
                    ->label('Date')
                    ->date()
                    ->sortable(),

                TextColumn::make('meal_type')
                    ->label('Meal')
                    ->badge()
                    ->sortable()
                    ->formatStateUsing(fn (string $state): string => ucfirst($state)),

                TextColumn::make('food_name_snapshot')
                    ->label('Food')
                    ->searchable()
                    ->sortable()
                    ->description(function (MealEntry $record): ?string {
                        $parts = collect([
                            $record->serving_label,
                            $record->total_grams ? number_format((float) $record->total_grams, 2).' g' : null,
                        ])->filter();

                        return $parts->isNotEmpty()
                            ? $parts->implode(' • ')
                            : null;
                    }),

                TextColumn::make('user.email')
                    ->label('User')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('calories')
                    ->label('Calories')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 0).' kcal'),

                TextColumn::make('protein_g')
                    ->label('Protein')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('carbs_g')
                    ->label('Carbs')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('fat_g')
                    ->label('Fat')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('quantity')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2))
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('serving_label')
                    ->label('Serving')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('total_grams')
                    ->label('Total grams')
                    ->sortable()
                    ->formatStateUsing(
                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                    )
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('food.name')
                    ->label('Linked food')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->placeholder('Manual entry'),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('meal_type')
                    ->label('Meal type')
                    ->options([
                        MealEntry::MEAL_BREAKFAST => 'Breakfast',
                        MealEntry::MEAL_LUNCH => 'Lunch',
                        MealEntry::MEAL_DINNER => 'Dinner',
                        MealEntry::MEAL_SNACK => 'Snack',
                    ]),

                Filter::make('manual_entries')
                    ->label('Manual entries')
                    ->query(fn (Builder $query): Builder => $query->whereNull('food_id')),

                Filter::make('linked_food_entries')
                    ->label('Linked food entries')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('food_id')),

                Filter::make('today')
                    ->label('Today')
                    ->query(fn (Builder $query): Builder => $query->whereDate('logged_for_date', now()->toDateString())),

                Filter::make('last_7_days')
                    ->label('Last 7 days')
                    ->query(fn (Builder $query): Builder => $query->whereDate('logged_for_date', '>=', now()->subDays(7)->toDateString())),

                Filter::make('last_30_days')
                    ->label('Last 30 days')
                    ->query(fn (Builder $query): Builder => $query->whereDate('logged_for_date', '>=', now()->subDays(30)->toDateString())),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }
}