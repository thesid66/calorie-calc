<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nutrition goals are stored historically.
 * This allows the user to review old targets later even if their profile changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nutrition_goals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('activity_level_id')
                ->constrained()
                ->restrictOnDelete();

            $table->enum('goal_type', ['lose', 'maintain', 'gain']);

            // Example: lose 0.25kg/week, 0.5kg/week, gain 0.25kg/week.
            $table->decimal('target_rate_kg_per_week', 4, 2)->nullable();

            $table->unsignedInteger('bmr');
            $table->unsignedInteger('tdee');
            $table->unsignedInteger('daily_calorie_target');

            $table->unsignedInteger('protein_target_g');
            $table->unsignedInteger('carb_target_g');
            $table->unsignedInteger('fat_target_g');

            $table->timestamp('calculated_at');

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_goals');
    }
};