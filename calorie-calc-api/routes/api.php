<?php

use App\Http\Controllers\Api\ActivityLevelController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarcodeController;
use App\Http\Controllers\Api\DiaryController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\FoodFavoriteController;
use App\Http\Controllers\Api\MealEntryController;
use App\Http\Controllers\Api\NutritionGoalController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\WeightLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'Calorie Calc API is running.',
            'timestamp' => now()->toISOString(),
        ]);
    });

    Route::post('/auth/register', [AuthController::class, 'register'])
        ->middleware('throttle:10,1');

    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);

        Route::get('/activity-levels', [ActivityLevelController::class, 'index']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);

        Route::get('/nutrition-goal', [NutritionGoalController::class, 'show']);
        Route::post('/nutrition-goal', [NutritionGoalController::class, 'store']);

        Route::get('/foods', [FoodController::class, 'index']);
        Route::post('/foods/custom', [FoodController::class, 'storeCustom']);
        Route::get('/foods/{food}', [FoodController::class, 'show']);

        Route::get('/diary', [DiaryController::class, 'show']);

        Route::post('/meal-entries', [MealEntryController::class, 'store']);
        Route::get('/meal-entries/recent', [MealEntryController::class, 'recent']);
        Route::get('/meal-entries/{mealEntry}', [MealEntryController::class, 'show']);
        Route::put('/meal-entries/{mealEntry}', [MealEntryController::class, 'update']);
        Route::delete('/meal-entries/{mealEntry}', [MealEntryController::class, 'destroy']);

        Route::get('/weight-logs', [WeightLogController::class, 'index']);
        Route::post('/weight-logs', [WeightLogController::class, 'store']);
        Route::get('/weight-logs/{weightLog}', [WeightLogController::class, 'show']);
        Route::put('/weight-logs/{weightLog}', [WeightLogController::class, 'update']);
        Route::delete('/weight-logs/{weightLog}', [WeightLogController::class, 'destroy']);

        Route::get('/progress/overview', [ProgressController::class, 'overview']);
        Route::get('/progress/weight', [ProgressController::class, 'weight']);
        Route::get('/progress/nutrition', [ProgressController::class, 'nutrition']);

        Route::get('/barcodes/{barcode}', [BarcodeController::class, 'show']);
        Route::post('/barcodes/{barcode}/save-as-food', [BarcodeController::class, 'saveAsFood']);

        Route::get('/food-favorites', [FoodFavoriteController::class, 'index']);
        Route::post('/food-favorites/{food}', [FoodFavoriteController::class, 'store']);
        Route::delete('/food-favorites/{food}', [FoodFavoriteController::class, 'destroy']);
    });
});