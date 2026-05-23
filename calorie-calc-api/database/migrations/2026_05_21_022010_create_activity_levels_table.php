<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Activity levels are stored in DB so we can adjust multipliers later
 * without changing application code.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_levels', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            // TDEE = BMR × multiplier
            $table->decimal('multiplier', 4, 3);

            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_levels');
    }
};