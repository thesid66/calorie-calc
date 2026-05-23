<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Food aliases improve search.
 *
 * Example:
 * - Dal Bhat
 * - Daal Bhat
 * - दाल भात
 * - Dal Bhaat
 *
 * All can point to the same food.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_aliases', function (Blueprint $table) {
            $table->id();

            $table->foreignId('food_id')
                ->constrained('foods')
                ->cascadeOnDelete();

            $table->string('alias');
            $table->string('locale')->nullable();

            $table->timestamps();

            $table->index('alias');
            $table->index(['food_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('food_aliases');
    }
};