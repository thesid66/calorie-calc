<?php

namespace App\Filament\Resources\Foods\Schemas;

use App\Models\Food;
use App\Models\User;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class FoodForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                TextInput::make('nepali_name')
                    ->label('Nepali name')
                    ->maxLength(255),

                TextInput::make('brand')
                    ->maxLength(255),

                TextInput::make('barcode')
                    ->maxLength(255)
                    ->unique(ignoreRecord: true)
                    ->helperText('Used for barcode lookup products.'),

                Select::make('food_type')
                    ->label('Food type')
                    ->required()
                    ->options([
                        'generic' => 'Generic',
                        'recipe' => 'Recipe',
                        'packaged' => 'Packaged',
                        'restaurant' => 'Restaurant',
                        'custom' => 'Custom',
                    ])
                    ->default('generic'),

                TextInput::make('cuisine')
                    ->maxLength(255)
                    ->helperText('Example: nepali, indian, western'),

                TextInput::make('calories_per_100g')
                    ->label('Calories per 100g')
                    ->numeric()
                    ->required()
                    ->minValue(0)
                    ->maxValue(10000)
                    ->suffix('kcal'),

                TextInput::make('protein_per_100g')
                    ->label('Protein per 100g')
                    ->numeric()
                    ->required()
                    ->minValue(0)
                    ->maxValue(1000)
                    ->suffix('g'),

                TextInput::make('carbs_per_100g')
                    ->label('Carbs per 100g')
                    ->numeric()
                    ->required()
                    ->minValue(0)
                    ->maxValue(1000)
                    ->suffix('g'),

                TextInput::make('fat_per_100g')
                    ->label('Fat per 100g')
                    ->numeric()
                    ->required()
                    ->minValue(0)
                    ->maxValue(1000)
                    ->suffix('g'),

                TextInput::make('fiber_per_100g')
                    ->label('Fiber per 100g')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(1000)
                    ->suffix('g'),

                TextInput::make('sugar_per_100g')
                    ->label('Sugar per 100g')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(1000)
                    ->suffix('g'),

                TextInput::make('sodium_mg_per_100g')
                    ->label('Sodium per 100g')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(100000)
                    ->suffix('mg'),

                Toggle::make('is_public')
                    ->label('Public food')
                    ->helperText('Public foods are visible to all users.')
                    ->default(true),

                Toggle::make('is_verified')
                    ->label('Verified')
                    ->helperText('Verified foods have been reviewed by admin.')
                    ->default(true),

                Select::make('source')
                    ->required()
                    ->options([
                        Food::SOURCE_SYSTEM => 'System',
                        Food::SOURCE_USER => 'User',
                        Food::SOURCE_USDA => 'USDA',
                        Food::SOURCE_OPEN_FOOD_FACTS => 'Open Food Facts',
                        Food::SOURCE_MANUAL => 'Manual',
                    ])
                    ->default(Food::SOURCE_SYSTEM),

                TextInput::make('source_id')
                    ->label('Source ID')
                    ->maxLength(255),

                Select::make('created_by_user_id')
                    ->label('Creator')
                    ->relationship('creator', 'email')
                    ->getOptionLabelFromRecordUsing(
                        fn (User $record): string => "{$record->name} ({$record->email})"
                    )
                    ->searchable(['name', 'email'])
                    ->preload()
                    ->helperText('Usually set for user-created foods only.'),
            ]);
    }
}