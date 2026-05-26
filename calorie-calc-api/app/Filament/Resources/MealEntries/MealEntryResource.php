<?php

namespace App\Filament\Resources\MealEntries;

use App\Filament\Resources\MealEntries\Pages\ListMealEntries;
use App\Filament\Resources\MealEntries\Pages\ViewMealEntry;
use App\Filament\Resources\MealEntries\Schemas\MealEntryInfolist;
use App\Filament\Resources\MealEntries\Tables\MealEntriesTable;
use App\Models\MealEntry;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class MealEntryResource extends Resource
{
    protected static ?string $model = MealEntry::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static string|UnitEnum|null $navigationGroup = 'Diary Management';

    protected static ?string $navigationLabel = 'Meal Entries';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'food_name_snapshot';

    public static function infolist(Schema $schema): Schema
    {
        return MealEntryInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return MealEntriesTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMealEntries::route('/'),
            'view' => ViewMealEntry::route('/{record}'),
        ];
    }
}