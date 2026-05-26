<?php

namespace App\Filament\Resources\Foods\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class FoodInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Food summary')
                    ->description('Main identity and searchable details.')
                    ->columnSpanFull()
                    ->columns(3)
                    ->collapsible()
                    ->schema([
                        TextEntry::make('name')
                            ->label('Food name')
                            ->size('lg')
                            ->weight('semibold'),

                        TextEntry::make('nepali_name')
                            ->label('Nepali name')
                            ->size('lg')
                            ->weight('semibold')
                            ->placeholder('-'),

                        TextEntry::make('brand')
                            ->size('lg')
                            ->weight('semibold')
                            ->placeholder('-'),

                        TextEntry::make('food_type')
                            ->label('Food type')
                            ->badge(),

                        TextEntry::make('cuisine')
                            ->size('lg')
                            ->weight('semibold')
                            ->placeholder('-'),

                        TextEntry::make('barcode')
                            ->size('lg')
                            ->weight('semibold')
                            ->placeholder('-'),
                    ]),

                Section::make('Nutrition per 100g')
                    ->description('Values used by the app to calculate calories and macros for servings.')
                    ->columnSpanFull()
                    ->columns(4)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextEntry::make('calories_per_100g')
                            ->label('Calories')
                            ->size('lg')
                            ->weight('semibold')
                            ->formatStateUsing(fn ($state): string => number_format((float) $state, 0).' kcal'),

                        TextEntry::make('protein_per_100g')
                            ->label('Protein')
                            ->size('lg')
                            ->weight('semibold')
                            ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                        TextEntry::make('carbs_per_100g')
                            ->label('Carbs')
                            ->size('lg')
                            ->weight('semibold')
                            ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                        TextEntry::make('fat_per_100g')
                            ->label('Fat')
                            ->size('lg')
                            ->weight('semibold')
                            ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                        TextEntry::make('fiber_per_100g')
                            ->label('Fiber')
                            ->size('lg')
                            ->weight('semibold')
                            ->formatStateUsing(
                                fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                            ),

                        TextEntry::make('sugar_per_100g')
                            ->label('Sugar')
                            ->size('lg')
                            ->weight('semibold')
                            ->formatStateUsing(
                                fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                            ),

                        TextEntry::make('sodium_mg_per_100g')
                            ->label('Sodium')
                            ->size('lg')
                            ->weight('semibold')
                            ->formatStateUsing(
                                fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' mg'
                            ),
                    ]),

                Section::make('Visibility and review')
                    ->description('Controls whether this food appears publicly and whether it has been reviewed.')
                    ->columnSpanFull()
                    ->columns(2)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        IconEntry::make('is_public')
                            ->label('Public food')
                            ->boolean(),

                        IconEntry::make('is_verified')
                            ->label('Verified food')
                            ->boolean(),
                    ]),

                Section::make('Source and ownership')
                    ->description('Original source and creator information.')
                    ->columnSpanFull()
                    ->columns(3)
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        TextEntry::make('source')
                            ->badge(),

                        TextEntry::make('source_id')
                            ->label('Source ID')
                            ->size('lg')
                            ->weight('semibold')
                            ->placeholder('-'),

                        TextEntry::make('creator.email')
                            ->label('Creator')
                            ->size('lg')
                            ->weight('semibold')
                            ->placeholder('-'),

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
            ]);
    }
}