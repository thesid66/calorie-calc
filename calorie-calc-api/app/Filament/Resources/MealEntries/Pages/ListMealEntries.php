<?php

namespace App\Filament\Resources\MealEntries\Pages;

use App\Filament\Resources\MealEntries\MealEntryResource;
use Filament\Resources\Pages\ListRecords;

class ListMealEntries extends ListRecords
{
    protected static string $resource = MealEntryResource::class;
}