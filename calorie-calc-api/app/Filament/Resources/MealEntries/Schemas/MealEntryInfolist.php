<?php

namespace App\Filament\Resources\MealEntries\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;

class MealEntryInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Meal entry details')
                    ->columnSpanFull()
                    ->tabs([
                        Tab::make('Entry summary')
                            ->columns(3)
                            ->schema([
                                TextEntry::make('food_name_snapshot')
                                    ->label('Food')
                                    ->size('lg')
                                    ->weight('semibold'),

                                TextEntry::make('meal_type')
                                    ->label('Meal')
                                    ->badge()
                                    ->formatStateUsing(fn (string $state): string => ucfirst($state)),

                                TextEntry::make('logged_for_date')
                                    ->label('Logged date')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->date(),

                                TextEntry::make('user.name')
                                    ->label('User name')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('-'),

                                TextEntry::make('user.email')
                                    ->label('User email')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('-'),

                                TextEntry::make('food.name')
                                    ->label('Linked food')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('Manual entry'),
                            ]),

                        Tab::make('Serving details')
                            ->columns(4)
                            ->schema([
                                TextEntry::make('quantity')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2)),

                                TextEntry::make('serving_label')
                                    ->label('Serving label')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('-'),

                                TextEntry::make('serving_grams')
                                    ->label('Serving grams')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(
                                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                                    ),

                                TextEntry::make('total_grams')
                                    ->label('Total grams')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(
                                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                                    ),
                            ]),

                        Tab::make('Nutrition snapshot')
                            ->columns(4)
                            ->schema([
                                TextEntry::make('calories')
                                    ->label('Calories')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 0).' kcal'),

                                TextEntry::make('protein_g')
                                    ->label('Protein')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                                TextEntry::make('carbs_g')
                                    ->label('Carbs')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                                TextEntry::make('fat_g')
                                    ->label('Fat')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                                TextEntry::make('fiber_g')
                                    ->label('Fiber')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(
                                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                                    ),

                                TextEntry::make('sugar_g')
                                    ->label('Sugar')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(
                                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                                    ),

                                TextEntry::make('sodium_mg')
                                    ->label('Sodium')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(
                                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' mg'
                                    ),
                            ]),

                        Tab::make('Notes and system')
                            ->columns(2)
                            ->schema([
                                TextEntry::make('notes')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('-')
                                    ->columnSpanFull(),

                                TextEntry::make('created_at')
                                    ->label('Created at')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->dateTime()
                                    ->placeholder('-'),

                                TextEntry::make('updated_at')
                                    ->label('Updated at')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->dateTime()
                                    ->placeholder('-'),
                            ]),
                    ]),
            ]);
    }
}