<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores actual food logs for a user.
 *
 * Important design decision:
 * We snapshot all nutrition values at the time of logging.
 *
 * Why?
 * If the master food database is corrected later, the user's old diary should
 * not unexpectedly change. Historical logs must remain stable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            /**
             * Nullable because users can also log manual quick entries.
             * Example: "Homemade dinner - 650 calories"
             */
            $table->foreignId('food_id')
                ->nullable()
                ->constrained('foods')
                ->nullOnDelete();

            $table->date('logged_for_date');

            $table->enum('meal_type', [
                'breakfast',
                'lunch',
                'dinner',
                'snack',
            ]);

            /**
             * Snapshot name allows logs to remain readable even if the original
             * food record is deleted, renamed, or replaced.
             */
            $table->string('food_name_snapshot');

            /**
             * For serving-based logging:
             * quantity = 2
             * serving_label = "1 bowl"
             * serving_grams = 150
             * total_grams = 300
             *
             * For manual logging, grams may be unknown, so total_grams is nullable.
             */
            $table->decimal('quantity', 8, 2)->default(1);
            $table->string('serving_label')->nullable();
            $table->decimal('serving_grams', 8, 2)->nullable();
            $table->decimal('total_grams', 8, 2)->nullable();

            /**
             * Snapshot totals for this actual entry, not per 100g.
             */
            $table->decimal('calories', 8, 2)->default(0);
            $table->decimal('protein_g', 8, 2)->default(0);
            $table->decimal('carbs_g', 8, 2)->default(0);
            $table->decimal('fat_g', 8, 2)->default(0);
            $table->decimal('fiber_g', 8, 2)->nullable();
            $table->decimal('sugar_g', 8, 2)->nullable();
            $table->decimal('sodium_mg', 8, 2)->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'logged_for_date']);
            $table->index(['user_id', 'meal_type']);
            $table->index(['food_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_entries');
    }
};