<?php

namespace App\Filament\Resources\Foods\Pages;

use App\Filament\Resources\Foods\FoodResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewFood extends ViewRecord
{
    protected static string $resource = FoodResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}