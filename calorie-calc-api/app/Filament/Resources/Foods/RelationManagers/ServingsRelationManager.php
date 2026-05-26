<?php

namespace App\Filament\Resources\Foods\RelationManagers;

use Filament\Actions\CreateAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ServingsRelationManager extends RelationManager
{
    protected static string $relationship = 'servings';

    protected static ?string $title = 'Servings';

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('label')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Example: 1 bowl, 1 plate, 100 g'),

                TextInput::make('grams')
                    ->numeric()
                    ->required()
                    ->minValue(0.01)
                    ->maxValue(10000)
                    ->suffix('g')
                    ->helperText('How many grams this serving represents.'),

                Toggle::make('is_default')
                    ->label('Default serving')
                    ->helperText('Default serving appears first in the app.')
                    ->default(false),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('label')
            ->defaultSort('is_default', 'desc')
            ->columns([
                TextColumn::make('label')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('grams')
                    ->sortable()
                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' g'),

                IconColumn::make('is_default')
                    ->label('Default')
                    ->boolean()
                    ->sortable(),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }
}