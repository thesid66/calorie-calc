<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Profile data is separated from the users table because body data,
 * goal data, and auth data should not be mixed together.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->date('date_of_birth');

            // Used for BMR formula calculation.
            $table->enum('sex_for_formula', ['male', 'female']);

            $table->decimal('height_cm', 6, 2);
            $table->decimal('starting_weight_kg', 6, 2);
            $table->decimal('current_weight_kg', 6, 2);
            $table->decimal('target_weight_kg', 6, 2)->nullable();

            $table->enum('unit_system', ['metric', 'imperial'])->default('metric');

            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};