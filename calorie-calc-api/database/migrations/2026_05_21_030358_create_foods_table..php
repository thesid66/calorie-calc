<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Master food table.
 *
 * This table supports:
 * - Our verified system foods
 * - Nepali/South Asian foods
 * - User-created custom foods
 * - USDA foods
 * - Open Food Facts barcode foods
 *
 * Nutrition is stored per 100g because this makes serving conversion simple:
 * total calories = calories_per_100g * total_grams / 100
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('foods', function (Blueprint $table) {
            $table->id();

            $table->foreignId('created_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('source', [
                'system',
                'user',
                'usda',
                'open_food_facts',
                'manual',
            ])->default('system');

            $table->string('source_id')->nullable();

            $table->string('name');
            $table->string('nepali_name')->nullable();
            $table->string('brand')->nullable();

            $table->string('barcode')->nullable()->unique();

            $table->enum('food_type', [
                'generic',
                'recipe',
                'packaged',
                'restaurant',
                'custom',
            ])->default('generic');

            $table->string('cuisine')->nullable();

            $table->decimal('calories_per_100g', 8, 2)->default(0);
            $table->decimal('protein_per_100g', 8, 2)->default(0);
            $table->decimal('carbs_per_100g', 8, 2)->default(0);
            $table->decimal('fat_per_100g', 8, 2)->default(0);

            $table->decimal('fiber_per_100g', 8, 2)->nullable();
            $table->decimal('sugar_per_100g', 8, 2)->nullable();
            $table->decimal('sodium_mg_per_100g', 8, 2)->nullable();

            /**
             * is_verified means this food has been reviewed by us.
             * Seed data can start as unverified and later be corrected.
             */
            $table->boolean('is_verified')->default(false);

            /**
             * User-created foods can be private.
             * System foods and external foods are usually public.
             */
            $table->boolean('is_public')->default(true);

            $table->timestamps();

            $table->index('source');
            $table->index('source_id');
            $table->index('name');
            $table->index('nepali_name');
            $table->index('brand');
            $table->index('cuisine');
            $table->index(['created_by_user_id', 'is_public']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('foods');
    }
};