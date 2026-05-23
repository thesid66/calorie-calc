<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BarcodeLookupResource;
use App\Http\Resources\FoodResource;
use App\Models\BarcodeLookupCache;
use App\Services\OpenFoodFactsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

class BarcodeController extends Controller
{
    public function show(
        Request $request,
        string $barcode,
        OpenFoodFactsService $openFoodFactsService
    ): JsonResponse {
        try {
            $cache = $openFoodFactsService->lookupBarcode(
                barcode: $barcode,
                forceRefresh: $request->boolean('force_refresh')
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), 502);
        }

        $cache->load('food.servings');

        return ApiResponse::success([
            'barcode_lookup' => new BarcodeLookupResource($cache),
        ]);
    }

    public function saveAsFood(
        string $barcode,
        OpenFoodFactsService $openFoodFactsService
    ): JsonResponse {
        try {
            $normalisedBarcode = $openFoodFactsService->normalizeBarcode($barcode);

            $cache = BarcodeLookupCache::query()
                ->where('barcode', $normalisedBarcode)
                ->where('provider', BarcodeLookupCache::PROVIDER_OPEN_FOOD_FACTS)
                ->first();

            if (! $cache) {
                $cache = $openFoodFactsService->lookupBarcode($normalisedBarcode);
            }

            $food = $openFoodFactsService->saveCachedProductAsFood(
                cache: $cache,
                userId: request()->user()->id
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), 502);
        }

        return ApiResponse::success([
            'food' => new FoodResource($food),
        ], 'Barcode product saved as food.');
    }
}