<?php

namespace Database\Seeders;

use App\Models\Food;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NepaliFoodSeeder extends Seeder
{
    public function run(): void
    {
        $foods = [
            [
                'name' => 'Dal Bhat Tarkari',
                'nepali_name' => 'दाल भात तरकारी',
                'food_type' => 'recipe',
                'cuisine' => 'nepali',
                'calories_per_100g' => 130,
                'protein_per_100g' => 4.20,
                'carbs_per_100g' => 24.00,
                'fat_per_100g' => 2.10,
                'fiber_per_100g' => 3.00,
                'servings' => [
                    ['label' => '1 medium plate', 'grams' => 450, 'is_default' => true],
                    ['label' => '1 large plate', 'grams' => 600, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'dal bhat', 'locale' => 'roman-ne'],
                    ['alias' => 'daal bhat', 'locale' => 'roman-ne'],
                    ['alias' => 'दाल भात', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Plain Cooked Rice',
                'nepali_name' => 'भात',
                'food_type' => 'generic',
                'cuisine' => 'nepali',
                'calories_per_100g' => 130,
                'protein_per_100g' => 2.70,
                'carbs_per_100g' => 28.00,
                'fat_per_100g' => 0.30,
                'fiber_per_100g' => 0.40,
                'servings' => [
                    ['label' => '1 bowl', 'grams' => 180, 'is_default' => true],
                    ['label' => '1 plate portion', 'grams' => 250, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'bhat', 'locale' => 'roman-ne'],
                    ['alias' => 'rice', 'locale' => 'en'],
                    ['alias' => 'भात', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Lentil Soup',
                'nepali_name' => 'दाल',
                'food_type' => 'generic',
                'cuisine' => 'nepali',
                'calories_per_100g' => 75,
                'protein_per_100g' => 5.00,
                'carbs_per_100g' => 11.00,
                'fat_per_100g' => 1.50,
                'fiber_per_100g' => 3.50,
                'servings' => [
                    ['label' => '1 small bowl', 'grams' => 150, 'is_default' => true],
                    ['label' => '1 medium bowl', 'grams' => 220, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'dal', 'locale' => 'roman-ne'],
                    ['alias' => 'daal', 'locale' => 'roman-ne'],
                    ['alias' => 'दाल', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Chicken Momo',
                'nepali_name' => 'चिकेन म:म:',
                'food_type' => 'recipe',
                'cuisine' => 'nepali',
                'calories_per_100g' => 220,
                'protein_per_100g' => 11.00,
                'carbs_per_100g' => 25.00,
                'fat_per_100g' => 8.00,
                'fiber_per_100g' => 1.50,
                'servings' => [
                    ['label' => '1 piece', 'grams' => 35, 'is_default' => true],
                    ['label' => '1 plate, 10 pieces', 'grams' => 350, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'chicken momo', 'locale' => 'en'],
                    ['alias' => 'momo chicken', 'locale' => 'en'],
                    ['alias' => 'चिकेन मम', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Buff Momo',
                'nepali_name' => 'बफ म:म:',
                'food_type' => 'recipe',
                'cuisine' => 'nepali',
                'calories_per_100g' => 240,
                'protein_per_100g' => 12.00,
                'carbs_per_100g' => 24.00,
                'fat_per_100g' => 10.00,
                'fiber_per_100g' => 1.20,
                'servings' => [
                    ['label' => '1 piece', 'grams' => 35, 'is_default' => true],
                    ['label' => '1 plate, 10 pieces', 'grams' => 350, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'buff momo', 'locale' => 'en'],
                    ['alias' => 'buffalo momo', 'locale' => 'en'],
                    ['alias' => 'बफ मम', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Milk Tea with Sugar',
                'nepali_name' => 'दूध चिया',
                'food_type' => 'generic',
                'cuisine' => 'nepali',
                'calories_per_100g' => 55,
                'protein_per_100g' => 1.80,
                'carbs_per_100g' => 8.50,
                'fat_per_100g' => 1.80,
                'fiber_per_100g' => 0,
                'servings' => [
                    ['label' => '1 small cup', 'grams' => 120, 'is_default' => true],
                    ['label' => '1 glass', 'grams' => 250, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'chiya', 'locale' => 'roman-ne'],
                    ['alias' => 'milk tea', 'locale' => 'en'],
                    ['alias' => 'दूध चिया', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Sel Roti',
                'nepali_name' => 'सेल रोटी',
                'food_type' => 'recipe',
                'cuisine' => 'nepali',
                'calories_per_100g' => 350,
                'protein_per_100g' => 5.50,
                'carbs_per_100g' => 58.00,
                'fat_per_100g' => 11.00,
                'fiber_per_100g' => 1.20,
                'servings' => [
                    ['label' => '1 piece', 'grams' => 70, 'is_default' => true],
                ],
                'aliases' => [
                    ['alias' => 'sel roti', 'locale' => 'roman-ne'],
                    ['alias' => 'selroti', 'locale' => 'roman-ne'],
                    ['alias' => 'सेल रोटी', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Chiura',
                'nepali_name' => 'चिउरा',
                'food_type' => 'generic',
                'cuisine' => 'nepali',
                'calories_per_100g' => 360,
                'protein_per_100g' => 6.50,
                'carbs_per_100g' => 78.00,
                'fat_per_100g' => 1.00,
                'fiber_per_100g' => 2.50,
                'servings' => [
                    ['label' => '1 small bowl', 'grams' => 50, 'is_default' => true],
                    ['label' => '1 medium bowl', 'grams' => 80, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'beaten rice', 'locale' => 'en'],
                    ['alias' => 'chiura', 'locale' => 'roman-ne'],
                    ['alias' => 'चिउरा', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Vegetable Chowmein',
                'nepali_name' => 'भेज चाउमिन',
                'food_type' => 'recipe',
                'cuisine' => 'nepali',
                'calories_per_100g' => 180,
                'protein_per_100g' => 5.00,
                'carbs_per_100g' => 28.00,
                'fat_per_100g' => 5.50,
                'fiber_per_100g' => 2.00,
                'servings' => [
                    ['label' => '1 plate', 'grams' => 350, 'is_default' => true],
                ],
                'aliases' => [
                    ['alias' => 'veg chowmein', 'locale' => 'en'],
                    ['alias' => 'chowmein', 'locale' => 'en'],
                    ['alias' => 'चाउमिन', 'locale' => 'ne'],
                ],
            ],
            [
                'name' => 'Chatpate',
                'nepali_name' => 'चटपटे',
                'food_type' => 'recipe',
                'cuisine' => 'nepali',
                'calories_per_100g' => 210,
                'protein_per_100g' => 6.00,
                'carbs_per_100g' => 32.00,
                'fat_per_100g' => 6.50,
                'fiber_per_100g' => 4.00,
                'servings' => [
                    ['label' => '1 paper cone', 'grams' => 180, 'is_default' => true],
                    ['label' => '1 plate', 'grams' => 250, 'is_default' => false],
                ],
                'aliases' => [
                    ['alias' => 'chatpate', 'locale' => 'roman-ne'],
                    ['alias' => 'चटपटे', 'locale' => 'ne'],
                ],
            ],
        ];

        DB::transaction(function () use ($foods) {
            foreach ($foods as $foodData) {
                $servings = $foodData['servings'];
                $aliases = $foodData['aliases'];

                unset($foodData['servings'], $foodData['aliases']);

                $food = Food::updateOrCreate(
                    [
                        'source' => Food::SOURCE_SYSTEM,
                        'name' => $foodData['name'],
                    ],
                    [
                        ...$foodData,
                        'source' => Food::SOURCE_SYSTEM,
                        'source_id' => null,
                        'brand' => null,
                        'barcode' => null,
                        'is_verified' => false,
                        'is_public' => true,
                    ]
                );

                $food->servings()->delete();
                $food->aliases()->delete();

                foreach ($servings as $serving) {
                    $food->servings()->create($serving);
                }

                foreach ($aliases as $alias) {
                    $food->aliases()->create($alias);
                }
            }
        });
    }
}