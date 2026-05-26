<?php

namespace App\Filament\Resources\Foods\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class FoodInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),

                TextEntry::make('nepali_name')
                    ->label('Nepali name')
                    ->placeholder('-'),

                TextEntry::make('brand')
                    ->placeholder('-'),

                TextEntry::make('barcode')
                    ->placeholder('-'),

                TextEntry::make('source')
                    ->badge(),

                TextEntry::make('source_id')
                    ->label('Source ID')
                    ->placeholder('-'),

                TextEntry::make('food_type')
                    ->label('Food type')
                    ->badge(),

                TextEntry::make('cuisine')
                    ->placeholder('-'),

                TextEntry::make('calories_per_100g')
                    ->label('Calories per 100g')
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' kcal'),

                TextEntry::make('protein_per_100g')
                    ->label('Protein per 100g')
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                TextEntry::make('carbs_per_100g')
                    ->label('Carbs per 100g')
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                TextEntry::make('fat_per_100g')
                    ->label('Fat per 100g')
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                TextEntry::make('fiber_per_100g')
                    ->label('Fiber per 100g')
                    ->formatStateUsing(
                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                    ),

                TextEntry::make('sugar_per_100g')
                    ->label('Sugar per 100g')
                    ->formatStateUsing(
                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' g'
                    ),

                TextEntry::make('sodium_mg_per_100g')
                    ->label('Sodium per 100g')
                    ->formatStateUsing(
                        fn ($state): string => $state === null ? '-' : number_format((float) $state, 2).' mg'
                    ),

                IconEntry::make('is_public')
                    ->label('Public')
                    ->boolean(),

                IconEntry::make('is_verified')
                    ->label('Verified')
                    ->boolean(),

                TextEntry::make('creator.email')
                    ->label('Creator')
                    ->placeholder('-'),

                TextEntry::make('created_at')
                    ->label('Created at')
                    ->dateTime()
                    ->placeholder('-'),

                TextEntry::make('updated_at')
                    ->label('Updated at')
                    ->dateTime()
                    ->placeholder('-'),
            ]);
    }
}