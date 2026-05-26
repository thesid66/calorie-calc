<?php

namespace App\Filament\Resources\WeightLogs\Pages;

use App\Filament\Resources\WeightLogs\WeightLogResource;
use Filament\Resources\Pages\ListRecords;

class ListWeightLogs extends ListRecords
{
    protected static string $resource = WeightLogResource::class;
}