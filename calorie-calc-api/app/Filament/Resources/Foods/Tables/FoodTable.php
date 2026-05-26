<?php

namespace App\Filament\Resources\Foods\Tables;

use App\Models\Food;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class FoodsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('name')
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->description(function (Food $record): ?string {
                        $parts = collect([
                            $record->brand,
                            $record->nepali_name,
                        ])->filter();

                        return $parts->isNotEmpty()
                            ? $parts->implode(' • ')
                            : null;
                    }),

                TextColumn::make('brand')
                    ->searchable()
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('barcode')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('source')
                    ->badge()
                    ->sortable(),

                TextColumn::make('food_type')
                    ->label('Type')
                    ->badge()
                    ->sortable(),

                TextColumn::make('cuisine')
                    ->searchable()
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('calories_per_100g')
                    ->label('Calories')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 0).' kcal'),

                TextColumn::make('protein_per_100g')
                    ->label('Protein')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 1).' g')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('carbs_per_100g')
                    ->label('Carbs')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 1).' g')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('fat_per_100g')
                    ->label('Fat')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 1).' g')
                    ->toggleable(isToggledHiddenByDefault: true),

                IconColumn::make('is_public')
                    ->label('Public')
                    ->boolean()
                    ->sortable(),

                IconColumn::make('is_verified')
                    ->label('Verified')
                    ->boolean()
                    ->sortable(),

                TextColumn::make('creator.email')
                    ->label('Creator')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Filter::make('public_foods')
                    ->label('Public foods')
                    ->query(fn (Builder $query): Builder => $query->where('is_public', true)),

                Filter::make('private_foods')
                    ->label('Private foods')
                    ->query(fn (Builder $query): Builder => $query->where('is_public', false)),

                Filter::make('verified_foods')
                    ->label('Verified foods')
                    ->query(fn (Builder $query): Builder => $query->where('is_verified', true)),

                Filter::make('unverified_foods')
                    ->label('Unverified foods')
                    ->query(fn (Builder $query): Builder => $query->where('is_verified', false)),

                SelectFilter::make('source')
                    ->options([
                        Food::SOURCE_SYSTEM => 'System',
                        Food::SOURCE_USER => 'User',
                        Food::SOURCE_USDA => 'USDA',
                        Food::SOURCE_OPEN_FOOD_FACTS => 'Open Food Facts',
                        Food::SOURCE_MANUAL => 'Manual',
                    ]),

                SelectFilter::make('food_type')
                    ->label('Food type')
                    ->options([
                        'generic' => 'Generic',
                        'recipe' => 'Recipe',
                        'packaged' => 'Packaged',
                        'restaurant' => 'Restaurant',
                        'custom' => 'Custom',
                    ]),

                Filter::make('user_created')
                    ->label('User-created foods')
                    ->query(
                        fn (Builder $query): Builder => $query->where(
                            fn (Builder $query): Builder => $query
                                ->where('source', Food::SOURCE_USER)
                                ->orWhereNotNull('created_by_user_id')
                        )
                    ),

                Filter::make('barcode_foods')
                    ->label('Packaged / barcode foods')
                    ->query(
                        fn (Builder $query): Builder => $query->where(
                            fn (Builder $query): Builder => $query
                                ->where('food_type', 'packaged')
                                ->orWhereNotNull('barcode')
                        )
                    ),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ]);
    }
}