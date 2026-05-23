<?php

namespace Tests\Feature;

use App\Models\ActivityLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NutritionGoalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_nutrition_goal_after_profile_setup(): void
    {
        $this->seed();

        $user = User::factory()->create();

        $user->profile()->create([
            'date_of_birth' => '1995-01-01',
            'sex_for_formula' => 'male',
            'height_cm' => 170,
            'starting_weight_kg' => 78,
            'current_weight_kg' => 78,
            'target_weight_kg' => 70,
            'unit_system' => 'metric',
        ]);

        $activityLevel = ActivityLevel::where('slug', 'lightly_active')->firstOrFail();

        $response = $this
            ->actingAs($user)
            ->postJson('/api/v1/nutrition-goal', [
                'activity_level_id' => $activityLevel->id,
                'goal_type' => 'lose',
                'target_rate_kg_per_week' => 0.5,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'active_goal' => [
                        'id',
                        'goal_type',
                        'bmr',
                        'tdee',
                        'daily_calorie_target',
                        'protein_target_g',
                        'carb_target_g',
                        'fat_target_g',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('nutrition_goals', [
            'user_id' => $user->id,
            'goal_type' => 'lose',
            'is_active' => true,
        ]);
    }

    public function test_user_cannot_create_goal_without_profile(): void
    {
        $this->seed();

        $user = User::factory()->create();

        $activityLevel = ActivityLevel::where('slug', 'sedentary')->firstOrFail();

        $response = $this
            ->actingAs($user)
            ->postJson('/api/v1/nutrition-goal', [
                'activity_level_id' => $activityLevel->id,
                'goal_type' => 'maintain',
            ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}