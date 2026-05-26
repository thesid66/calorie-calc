<?php

namespace App\Filament\Resources\WeightLogs\Tables;

use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class WeightLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('logged_on', 'desc')
            ->columns([
                TextColumn::make('logged_on')
                    ->label('Logged date')
                    ->date()
                    ->sortable(),

                TextColumn::make('user.name')
                    ->label('User')
                    ->searchable()
                    ->sortable()
                    ->placeholder('-'),

                TextColumn::make('user.email')
                    ->label('Email')
                    ->searchable()
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('weight_kg')
                    ->label('Weight')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' kg'),

                TextColumn::make('notes')
                    ->limit(50)
                    ->placeholder('-')
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('user_id')
                    ->label('User')
                    ->relationship('user', 'email')
                    ->searchable()
                    ->preload(),

                Filter::make('today')
                    ->label('Today')
                    ->query(fn (Builder $query): Builder => $query->whereDate('logged_on', now()->toDateString())),

                Filter::make('last_7_days')
                    ->label('Last 7 days')
                    ->query(fn (Builder $query): Builder => $query->whereDate('logged_on', '>=', now()->subDays(7)->toDateString())),

                Filter::make('last_30_days')
                    ->label('Last 30 days')
                    ->query(fn (Builder $query): Builder => $query->whereDate('logged_on', '>=', now()->subDays(30)->toDateString())),

                Filter::make('with_notes')
                    ->label('With notes')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('notes')->where('notes', '!=', '')),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }
}