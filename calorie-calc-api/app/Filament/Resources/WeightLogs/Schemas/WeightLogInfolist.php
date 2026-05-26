<?php

namespace App\Filament\Resources\WeightLogs\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;

class WeightLogInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Weight log details')
                    ->columnSpanFull()
                    ->tabs([
                        Tab::make('Weight summary')
                            ->columns(3)
                            ->schema([
                                TextEntry::make('weight_kg')
                                    ->label('Weight')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->formatStateUsing(fn ($state): string => number_format((float) $state, 2).' kg'),

                                TextEntry::make('logged_on')
                                    ->label('Logged date')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->date(),

                                TextEntry::make('user.name')
                                    ->label('User')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('-'),

                                TextEntry::make('user.email')
                                    ->label('Email')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('-'),
                            ]),

                        Tab::make('Notes')
                            ->columns(1)
                            ->schema([
                                TextEntry::make('notes')
                                    ->size('lg')
                                    ->weight('semibold')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                            ]),

                        Tab::make('System information')
                            ->columns(2)
                            ->schema([
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