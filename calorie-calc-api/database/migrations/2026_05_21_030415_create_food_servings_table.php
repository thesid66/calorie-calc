<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores practical serving sizes.
 *
 * This is very important for Nepali/South Asian foods because users do not
 * usually log food only in grams. They think in plates, bowls, cups, glasses,
 * pieces, and spoons.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_servings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('food_id')
                ->constrained('foods')
                ->cascadeOnDelete();

            $table->string('label');

            /**
             * Example:
             * 1 plate dal bhat = 450g
             * 1 bowl dal = 180g
             * 1 piece momo = 35g
             */
            $table->decimal('grams', 8, 2);

            $table->boolean('is_default')->default(false);

            $table->timestamps();

            $table->index(['food_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_servings');
    }
};