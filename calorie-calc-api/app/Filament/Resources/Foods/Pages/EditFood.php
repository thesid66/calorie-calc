<?php

namespace App\Filament\Resources\Foods\Pages;

use App\Filament\Resources\Foods\FoodResource;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditFood extends EditRecord
{
    protected static string $resource = FoodResource::class;

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
        ];
    }
}