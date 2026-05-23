<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Caches external barcode lookup results.
 *
 * Why?
 * - Open Food Facts has rate limits.
 * - Barcode products do not change every minute.
 * - Cached responses make the app faster.
 * - We keep raw_response for debugging and future remapping.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barcode_lookup_cache', function (Blueprint $table) {
            $table->id();

            $table->foreignId('food_id')
                ->nullable()
                ->constrained('foods')
                ->nullOnDelete();

            $table->string('barcode')->unique();
            $table->string('provider')->default('open_food_facts');

            $table->string('status')->default('unknown');
            $table->string('status_verbose')->nullable();

            $table->string('product_name')->nullable();
            $table->string('brand')->nullable();

            $table->jsonb('mapped_product')->nullable();
            $table->jsonb('raw_response')->nullable();

            $table->timestamp('last_fetched_at')->nullable();

            $table->timestamps();

            $table->index('provider');
            $table->index('status');
            $table->index('food_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barcode_lookup_cache');
    }
};