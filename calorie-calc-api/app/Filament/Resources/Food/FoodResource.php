<?php

namespace App\Filament\Resources\Foods;

use App\Filament\Resources\Foods\Pages\CreateFood;
use App\Filament\Resources\Foods\Pages\EditFood;
use App\Filament\Resources\Foods\Pages\ListFoods;
use App\Filament\Resources\Foods\Pages\ViewFood;
use App\Filament\Resources\Foods\Schemas\FoodForm;
use App\Filament\Resources\Foods\Schemas\FoodInfolist;
use App\Filament\Resources\Foods\Tables\FoodsTable;
use App\Models\Food;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class FoodResource extends Resource
{
    protected static ?string $model = Food::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static string|UnitEnum|null $navigationGroup = 'Food Database';

    protected static ?string $navigationLabel = 'Foods';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return FoodForm::configure($schema);
    }

    public static function infolist(Schema $schema): Schema
    {
        return FoodInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return FoodsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListFoods::route('/'),
            'create' => CreateFood::route('/create'),
            'view' => ViewFood::route('/{record}'),
            'edit' => EditFood::route('/{record}/edit'),
        ];
    }
}