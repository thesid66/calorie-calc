<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ActivityLevelSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('activity_levels')->upsert([
            [
                'name' => 'Sedentary',
                'slug' => 'sedentary',
                'description' => 'Little or no exercise, mostly sitting work.',
                'multiplier' => 1.200,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Lightly Active',
                'slug' => 'lightly_active',
                'description' => 'Light exercise or walking 1-3 days per week.',
                'multiplier' => 1.375,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Moderately Active',
                'slug' => 'moderately_active',
                'description' => 'Moderate exercise 3-5 days per week.',
                'multiplier' => 1.550,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Very Active',
                'slug' => 'very_active',
                'description' => 'Hard exercise 6-7 days per week.',
                'multiplier' => 1.725,
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Extra Active',
                'slug' => 'extra_active',
                'description' => 'Very hard exercise, athlete routine, or physical labour job.',
                'multiplier' => 1.900,
                'is_active' => true,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['slug'], [
            'name',
            'description',
            'multiplier',
            'is_active',
            'sort_order',
            'updated_at',
        ]);
    }
}