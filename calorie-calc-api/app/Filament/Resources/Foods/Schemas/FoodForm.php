<?php

namespace App\Filament\Resources\Foods\Schemas;

use App\Models\Food;
use App\Models\User;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class FoodForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Basic food details')
                    ->description('Main identity and searchable details for this food.')
                    ->columns(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Food name')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Example: Dal Bhat'),

                        TextInput::make('nepali_name')
                            ->label('Nepali name')
                            ->maxLength(255)
                            ->placeholder('Example: दाल भात'),

                        TextInput::make('brand')
                            ->maxLength(255)
                            ->placeholder('Example: Wai Wai, Amul, Patanjali'),

                        TextInput::make('barcode')
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->placeholder('Example: 8901234567890')
                            ->helperText('Used for packaged foods and barcode lookup.'),

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
                            ->default('generic')
                            ->native(false),

                        TextInput::make('cuisine')
                            ->maxLength(255)
                            ->placeholder('Example: Nepali, Indian, Western')
                            ->helperText('Useful for filtering regional foods.'),
                    ]),

                Section::make('Nutrition per 100g')
                    ->description('Nutrition values should be entered per 100 grams. The app uses these values to calculate servings.')
                    ->columns(4)
                    ->schema([
                        TextInput::make('calories_per_100g')
                            ->label('Calories')
                            ->numeric()
                            ->required()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(10000)
                            ->suffix('kcal'),

                        TextInput::make('protein_per_100g')
                            ->label('Protein')
                            ->numeric()
                            ->required()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(1000)
                            ->suffix('g'),

                        TextInput::make('carbs_per_100g')
                            ->label('Carbs')
                            ->numeric()
                            ->required()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(1000)
                            ->suffix('g'),

                        TextInput::make('fat_per_100g')
                            ->label('Fat')
                            ->numeric()
                            ->required()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(1000)
                            ->suffix('g'),

                        TextInput::make('fiber_per_100g')
                            ->label('Fiber')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(1000)
                            ->suffix('g'),

                        TextInput::make('sugar_per_100g')
                            ->label('Sugar')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(1000)
                            ->suffix('g'),

                        TextInput::make('sodium_mg_per_100g')
                            ->label('Sodium')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(100000)
                            ->suffix('mg'),
                    ]),

                Section::make('Visibility and review')
                    ->description('Control whether users can see this food and whether it has been reviewed by admin.')
                    ->columns(2)
                    ->schema([
                        Toggle::make('is_public')
                            ->label('Public food')
                            ->helperText('Public foods are visible to all users.')
                            ->default(true)
                            ->inline(false),

                        Toggle::make('is_verified')
                            ->label('Verified food')
                            ->helperText('Verified foods have been reviewed and approved by admin.')
                            ->default(true)
                            ->inline(false),
                    ]),

                Section::make('Source and ownership')
                    ->description('Track where this food came from. Usually only user-created foods need a creator.')
                    ->columns(2)
                    ->collapsible()
                    ->schema([
                        Select::make('source')
                            ->required()
                            ->options([
                                Food::SOURCE_SYSTEM => 'System',
                                Food::SOURCE_USER => 'User',
                                Food::SOURCE_USDA => 'USDA',
                                Food::SOURCE_OPEN_FOOD_FACTS => 'Open Food Facts',
                                Food::SOURCE_MANUAL => 'Manual',
                            ])
                            ->default(Food::SOURCE_SYSTEM)
                            ->native(false),

                        TextInput::make('source_id')
                            ->label('Source ID')
                            ->maxLength(255)
                            ->placeholder('External database ID, if available'),

                        Select::make('created_by_user_id')
                            ->label('Creator')
                            ->relationship('creator', 'email')
                            ->getOptionLabelFromRecordUsing(
                                fn (User $record): string => "{$record->name} ({$record->email})"
                            )
                            ->searchable(['name', 'email'])
                            ->preload()
                            ->helperText('Usually set for user-created foods only.'),
                    ]),
            ]);
    }
}