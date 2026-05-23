<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => $validated['password'],
        ]);

        $token = $user->createToken(
            $validated['device_name'] ?? 'expo-app'
        )->plainTextToken;

        return ApiResponse::success([
            'token_type' => 'Bearer',
            'access_token' => $token,
            'user' => new UserResource($user),
        ], 'Account created successfully.', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', strtolower(trim($validated['email'])))->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken(
            $validated['device_name'] ?? 'expo-app'
        )->plainTextToken;

        return ApiResponse::success([
            'token_type' => 'Bearer',
            'access_token' => $token,
            'user' => new UserResource($user->load('profile')),
        ], 'Logged in successfully.');
    }

    public function me(): JsonResponse
    {
        $user = request()->user()->load(['profile', 'activeNutritionGoal.activityLevel']);

        return ApiResponse::success([
            'user' => new UserResource($user),
            'profile' => $user->profile
                ? new \App\Http\Resources\UserProfileResource($user->profile)
                : null,
            'active_goal' => $user->activeNutritionGoal
                ? new \App\Http\Resources\NutritionGoalResource($user->activeNutritionGoal)
                : null,
        ]);
    }

    public function logout(): JsonResponse
    {
        request()->user()->currentAccessToken()?->delete();

        return ApiResponse::success(null, 'Logged out successfully.');
    }

    public function logoutAll(): JsonResponse
    {
        request()->user()->tokens()->delete();

        return ApiResponse::success(null, 'Logged out from all devices successfully.');
    }
}