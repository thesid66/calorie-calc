<?php

namespace App\Filament\Resources\WeightLogs;

use App\Filament\Resources\WeightLogs\Pages\ListWeightLogs;
use App\Filament\Resources\WeightLogs\Pages\ViewWeightLog;
use App\Filament\Resources\WeightLogs\Schemas\WeightLogInfolist;
use App\Filament\Resources\WeightLogs\Tables\WeightLogsTable;
use App\Models\WeightLog;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class WeightLogResource extends Resource
{
    protected static ?string $model = WeightLog::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static string|UnitEnum|null $navigationGroup = 'Progress Management';

    protected static ?string $navigationLabel = 'Weight Logs';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'weight_kg';

    public static function infolist(Schema $schema): Schema
    {
        return WeightLogInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return WeightLogsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListWeightLogs::route('/'),
            'view' => ViewWeightLog::route('/{record}'),
        ];
    }
}