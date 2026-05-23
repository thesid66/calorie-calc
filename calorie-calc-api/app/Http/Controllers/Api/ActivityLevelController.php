<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLevelResource;
use App\Models\ActivityLevel;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ActivityLevelController extends Controller
{
    public function index(): JsonResponse
    {
        $levels = ActivityLevel::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success([
            'activity_levels' => ActivityLevelResource::collection($levels),
        ]);
    }
}