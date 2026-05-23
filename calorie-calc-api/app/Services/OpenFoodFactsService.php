<?php

namespace App\Services;

use App\Models\BarcodeLookupCache;
use App\Models\Food;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use RuntimeException;

class OpenFoodFactsService
{
    /**
     * We request only the fields we need.
     * This keeps responses smaller and faster.
     */
    private const PRODUCT_FIELDS = [
        'code',
        'product_name',
        'generic_name',
        'brands',
        'quantity',
        'serving_size',
        'categories',
        'countries',
        'image_front_url',
        'image_nutrition_url',
        'nutriments',
    ];

    public function lookupBarcode(string $barcode, bool $forceRefresh = false): BarcodeLookupCache
    {
        $barcode = $this->normalizeBarcode($barcode);

        /**
         * 1. If the product already exists in our Food table, return it immediately.
         */
        $existingFood = Food::query()
            ->where('barcode', $barcode)
            ->first();

        if ($existingFood && ! $forceRefresh) {
            return BarcodeLookupCache::query()->updateOrCreate(
                [
                    'barcode' => $barcode,
                    'provider' => BarcodeLookupCache::PROVIDER_OPEN_FOOD_FACTS,
                ],
                [
                    'food_id' => $existingFood->id,
                    'status' => BarcodeLookupCache::STATUS_FOUND,
                    'status_verbose' => 'Found in local food database.',
                    'product_name' => $existingFood->name,
                    'brand' => $existingFood->brand,
                    'mapped_product' => $this->mapFoodToBarcodeProduct($existingFood),
                    'last_fetched_at' => now(),
                ]
            );
        }

        /**
         * 2. Use fresh cache when available.
         */
        $cached = BarcodeLookupCache::query()
            ->where('barcode', $barcode)
            ->where('provider', BarcodeLookupCache::PROVIDER_OPEN_FOOD_FACTS)
            ->first();

        if ($cached && $cached->isFresh() && ! $forceRefresh) {
            return $cached->load('food');
        }

        /**
         * 3. Fetch from Open Food Facts.
         */
        $response = $this->fetchFromOpenFoodFacts($barcode);

        $status = (int) data_get($response, 'status', 0);
        $statusVerbose = data_get($response, 'status_verbose');

        if ($status !== 1) {
            return BarcodeLookupCache::query()->updateOrCreate(
                [
                    'barcode' => $barcode,
                    'provider' => BarcodeLookupCache::PROVIDER_OPEN_FOOD_FACTS,
                ],
                [
                    'status' => BarcodeLookupCache::STATUS_NOT_FOUND,
                    'status_verbose' => $statusVerbose ?: 'Product not found.',
                    'product_name' => null,
                    'brand' => null,
                    'mapped_product' => null,
                    'raw_response' => $response,
                    'last_fetched_at' => now(),
                ]
            );
        }

        $mappedProduct = $this->mapOpenFoodFactsProduct($barcode, $response);

        return BarcodeLookupCache::query()->updateOrCreate(
            [
                'barcode' => $barcode,
                'provider' => BarcodeLookupCache::PROVIDER_OPEN_FOOD_FACTS,
            ],
            [
                'status' => BarcodeLookupCache::STATUS_FOUND,
                'status_verbose' => $statusVerbose ?: 'Product found.',
                'product_name' => $mappedProduct['name'],
                'brand' => $mappedProduct['brand'],
                'mapped_product' => $mappedProduct,
                'raw_response' => $response,
                'last_fetched_at' => now(),
            ]
        );
    }

    public function saveCachedProductAsFood(BarcodeLookupCache $cache, ?int $userId = null): Food
    {
        if ($cache->status !== BarcodeLookupCache::STATUS_FOUND || ! $cache->mapped_product) {
            throw new InvalidArgumentException('Barcode product is not available to save as food.');
        }

        $mapped = $cache->mapped_product;

        $food = Food::query()->updateOrCreate(
            [
                'barcode' => $cache->barcode,
            ],
            [
                'created_by_user_id' => null,

                /**
                 * Barcode products are saved as Open Food Facts foods.
                 * We keep them public because barcode foods are useful to all users.
                 */
                'source' => Food::SOURCE_OPEN_FOOD_FACTS,
                'source_id' => $cache->barcode,

                'name' => $mapped['name'],
                'nepali_name' => null,
                'brand' => $mapped['brand'],
                'barcode' => $cache->barcode,

                'food_type' => 'packaged',
                'cuisine' => null,

                'calories_per_100g' => $mapped['nutrition_per_100g']['calories'] ?? 0,
                'protein_per_100g' => $mapped['nutrition_per_100g']['protein_g'] ?? 0,
                'carbs_per_100g' => $mapped['nutrition_per_100g']['carbs_g'] ?? 0,
                'fat_per_100g' => $mapped['nutrition_per_100g']['fat_g'] ?? 0,
                'fiber_per_100g' => $mapped['nutrition_per_100g']['fiber_g'] ?? null,
                'sugar_per_100g' => $mapped['nutrition_per_100g']['sugar_g'] ?? null,
                'sodium_mg_per_100g' => $mapped['nutrition_per_100g']['sodium_mg'] ?? null,

                /**
                 * We do not mark external crowdsourced products as verified.
                 * Later we can add an admin verification workflow.
                 */
                'is_verified' => false,
                'is_public' => true,
            ]
        );

        /**
         * Ensure at least one serving option exists.
         */
        if (! $food->servings()->exists()) {
            $food->servings()->create([
                'label' => '100 g',
                'grams' => 100,
                'is_default' => true,
            ]);
        }

        $servingSize = $mapped['serving_size'] ?? null;

        if ($servingSize) {
            $servingGrams = $this->extractServingGrams($servingSize);

            if ($servingGrams !== null) {
                $food->servings()->updateOrCreate(
                    [
                        'label' => $servingSize,
                    ],
                    [
                        'grams' => $servingGrams,
                        'is_default' => false,
                    ]
                );
            }
        }

        $cache->update([
            'food_id' => $food->id,
        ]);

        return $food->load('servings', 'aliases');
    }

    private function fetchFromOpenFoodFacts(string $barcode): array
    {
        $baseUrl = rtrim((string) config('services.open_food_facts.base_url'), '/');
        $userAgent = (string) config('services.open_food_facts.user_agent');

        try {
            $response = Http::acceptJson()
                ->withUserAgent($userAgent)
                ->timeout(10)
                ->retry(2, 300)
                ->get("{$baseUrl}/api/v2/product/{$barcode}", [
                    'fields' => implode(',', self::PRODUCT_FIELDS),
                ]);
        } catch (ConnectionException $exception) {
            throw new RuntimeException('Unable to connect to Open Food Facts.');
        }

        if (! $response->successful()) {
            throw new RuntimeException('Open Food Facts request failed.');
        }

        return $response->json();
    }

    private function mapOpenFoodFactsProduct(string $barcode, array $response): array
    {
        $product = data_get($response, 'product', []);
        $nutriments = data_get($product, 'nutriments', []);

        $name = $this->firstNonEmpty([
            data_get($product, 'product_name'),
            data_get($product, 'generic_name'),
            'Barcode product '.$barcode,
        ]);

        $brand = $this->nullableString(data_get($product, 'brands'));

        return [
            'barcode' => $barcode,
            'name' => $name,
            'generic_name' => $this->nullableString(data_get($product, 'generic_name')),
            'brand' => $brand,
            'quantity' => $this->nullableString(data_get($product, 'quantity')),
            'serving_size' => $this->nullableString(data_get($product, 'serving_size')),
            'categories' => $this->nullableString(data_get($product, 'categories')),
            'countries' => $this->nullableString(data_get($product, 'countries')),
            'image_front_url' => $this->nullableString(data_get($product, 'image_front_url')),
            'image_nutrition_url' => $this->nullableString(data_get($product, 'image_nutrition_url')),

            'nutrition_per_100g' => [
                'calories' => $this->caloriesPer100g($nutriments),
                'protein_g' => $this->numeric(data_get($nutriments, 'proteins_100g'), 0),
                'carbs_g' => $this->numeric(data_get($nutriments, 'carbohydrates_100g'), 0),
                'fat_g' => $this->numeric(data_get($nutriments, 'fat_100g'), 0),
                'fiber_g' => $this->numericOrNull(data_get($nutriments, 'fiber_100g')),
                'sugar_g' => $this->numericOrNull(data_get($nutriments, 'sugars_100g')),
                'sodium_mg' => $this->sodiumMgPer100g($nutriments),
            ],

            'data_quality' => [
                'has_calories' => $this->caloriesPer100g($nutriments) > 0,
                'has_macros' => $this->numeric(data_get($nutriments, 'proteins_100g'), 0) > 0
                    || $this->numeric(data_get($nutriments, 'carbohydrates_100g'), 0) > 0
                    || $this->numeric(data_get($nutriments, 'fat_100g'), 0) > 0,
            ],
        ];
    }

    private function mapFoodToBarcodeProduct(Food $food): array
    {
        return [
            'barcode' => $food->barcode,
            'name' => $food->name,
            'brand' => $food->brand,
            'serving_size' => null,
            'nutrition_per_100g' => [
                'calories' => (float) $food->calories_per_100g,
                'protein_g' => (float) $food->protein_per_100g,
                'carbs_g' => (float) $food->carbs_per_100g,
                'fat_g' => (float) $food->fat_per_100g,
                'fiber_g' => $food->fiber_per_100g !== null ? (float) $food->fiber_per_100g : null,
                'sugar_g' => $food->sugar_per_100g !== null ? (float) $food->sugar_per_100g : null,
                'sodium_mg' => $food->sodium_mg_per_100g !== null ? (float) $food->sodium_mg_per_100g : null,
            ],
            'data_quality' => [
                'has_calories' => (float) $food->calories_per_100g > 0,
                'has_macros' => (float) $food->protein_per_100g > 0
                    || (float) $food->carbs_per_100g > 0
                    || (float) $food->fat_per_100g > 0,
            ],
        ];
    }

    public function normalizeBarcode(string $barcode): string
    {
        $barcode = trim($barcode);

        if (! preg_match('/^[0-9]{6,32}$/', $barcode)) {
            throw new InvalidArgumentException('Barcode must contain 6 to 32 digits only.');
        }

        return $barcode;
    }

    private function caloriesPer100g(array $nutriments): float
    {
        $kcal = $this->numericOrNull(data_get($nutriments, 'energy-kcal_100g'));

        if ($kcal !== null) {
            return $kcal;
        }

        /**
         * Some products may only provide energy in kJ.
         * 1 kcal = 4.184 kJ.
         */
        $kj = $this->numericOrNull(data_get($nutriments, 'energy_100g'));

        if ($kj !== null) {
            return round($kj / 4.184, 2);
        }

        return 0;
    }

    private function sodiumMgPer100g(array $nutriments): ?float
    {
        $sodiumG = $this->numericOrNull(data_get($nutriments, 'sodium_100g'));

        if ($sodiumG !== null) {
            return round($sodiumG * 1000, 2);
        }

        /**
         * If sodium is missing but salt is present:
         * sodium ≈ salt × 393.4 mg per gram of salt.
         */
        $saltG = $this->numericOrNull(data_get($nutriments, 'salt_100g'));

        if ($saltG !== null) {
            return round($saltG * 393.4, 2);
        }

        return null;
    }

    private function extractServingGrams(string $servingSize): ?float
    {
        /**
         * Handles simple values like:
         * - "30 g"
         * - "30g"
         * - "1 serving (45 g)"
         */
        if (preg_match('/([0-9]+(?:\.[0-9]+)?)\s*g\b/i', $servingSize, $matches)) {
            return round((float) $matches[1], 2);
        }

        return null;
    }

    private function numeric(mixed $value, float $default = 0): float
    {
        if ($value === null || $value === '') {
            return $default;
        }

        return round((float) $value, 2);
    }

    private function numericOrNull(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return round((float) $value, 2);
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }

    private function firstNonEmpty(array $values): string
    {
        foreach ($values as $value) {
            $value = $this->nullableString($value);

            if ($value !== null) {
                return $value;
            }
        }

        return 'Unknown product';
    }
}