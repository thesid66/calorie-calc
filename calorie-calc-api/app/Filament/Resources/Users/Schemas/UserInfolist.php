<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('name'),
                TextEntry::make('email')
                    ->label('Email address'),
                IconEntry::make('is_admin')
                    ->label('Admin access')
                    ->boolean(),
                TextEntry::make('email_verified_at')
                    ->label('Email verified at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('created_at')
                    ->label('Created at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->label('Updated at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('profile.current_weight_kg')
                    ->label('Current weight (kg)')
                    ->placeholder('-'),
                TextEntry::make('profile.target_weight_kg')
                    ->label('Target weight (kg)')
                    ->placeholder('-'),
                TextEntry::make('profile.height_cm')
                    ->label('Height (cm)')
                    ->placeholder('-'),
            ]);
    }
}
