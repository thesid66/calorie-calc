<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserProfileResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $profile = request()->user()->profile;

        return ApiResponse::success([
            'profile' => $profile ? new UserProfileResource($profile) : null,
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        /**
         * updateOrCreate is used because onboarding may create the profile,
         * while settings page may update the same profile later.
         */
        $profile = $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        /**
         * Create or update today's weight log when profile current weight changes.
         * This keeps the user's progress chart useful from day one.
         */
        $user->weightLogs()->updateOrCreate(
            ['logged_on' => now()->toDateString()],
            [
                'weight_kg' => $validated['current_weight_kg'],
                'notes' => 'Updated from profile setup.',
            ]
        );

        return ApiResponse::success([
            'profile' => new UserProfileResource($profile),
        ], 'Profile saved successfully.');
    }
}