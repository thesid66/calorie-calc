<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\WeightLogs\StoreWeightLogRequest;
use App\Http\Requests\WeightLogs\UpdateWeightLogRequest;
use App\Http\Resources\WeightLogResource;
use App\Models\WeightLog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WeightLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->query(), [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        if ($validator->fails()) {
            return ApiResponse::error('Invalid date range.', 422, $validator->errors());
        }

        $from = $request->query('from', now()->subDays(29)->toDateString());
        $to = $request->query('to', now()->toDateString());

        $logs = $request->user()
            ->weightLogs()
            ->whereBetween('logged_on', [$from, $to])
            ->orderBy('logged_on')
            ->get();

        return ApiResponse::success([
            'from' => $from,
            'to' => $to,
            'weight_logs' => WeightLogResource::collection($logs),
        ]);
    }

    public function show(WeightLog $weightLog): JsonResponse
    {
        $this->ensureUserOwnsWeightLog($weightLog);

        return ApiResponse::success([
            'weight_log' => new WeightLogResource($weightLog),
        ]);
    }

    public function store(StoreWeightLogRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        /**
         * updateOrCreate is intentional.
         * A user should have only one weight log per date.
         * If they log again for the same date, we update the existing record.
         */
        $weightLog = $user->weightLogs()->updateOrCreate(
            ['logged_on' => $validated['logged_on']],
            [
                'weight_kg' => $validated['weight_kg'],
                'notes' => $validated['notes'] ?? null,
            ]
        );

        $this->syncProfileCurrentWeight($user->id);

        return ApiResponse::success([
            'weight_log' => new WeightLogResource($weightLog),
        ], 'Weight log saved successfully.', $weightLog->wasRecentlyCreated ? 201 : 200);
    }

    public function update(UpdateWeightLogRequest $request, WeightLog $weightLog): JsonResponse
    {
        $this->ensureUserOwnsWeightLog($weightLog);

        $validated = $request->validated();

        /**
         * Prevent duplicate date conflict when moving a log to another date.
         */
        $existingLogForDate = WeightLog::query()
            ->where('user_id', $request->user()->id)
            ->where('logged_on', $validated['logged_on'])
            ->where('id', '!=', $weightLog->id)
            ->first();

        if ($existingLogForDate) {
            return ApiResponse::error(
                'A weight log already exists for this date.',
                422,
                ['logged_on' => ['A weight log already exists for this date.']]
            );
        }

        $weightLog->update([
            'logged_on' => $validated['logged_on'],
            'weight_kg' => $validated['weight_kg'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->syncProfileCurrentWeight($request->user()->id);

        return ApiResponse::success([
            'weight_log' => new WeightLogResource($weightLog),
        ], 'Weight log updated successfully.');
    }

    public function destroy(WeightLog $weightLog): JsonResponse
    {
        $this->ensureUserOwnsWeightLog($weightLog);

        $userId = $weightLog->user_id;

        $weightLog->delete();

        $this->syncProfileCurrentWeight($userId);

        return ApiResponse::success(null, 'Weight log deleted successfully.');
    }

    private function ensureUserOwnsWeightLog(WeightLog $weightLog): void
    {
        if ($weightLog->user_id !== request()->user()->id) {
            abort(404);
        }
    }

    /**
     * Keeps user_profiles.current_weight_kg in sync with the latest weight log.
     * This is useful because calorie recalculation depends on current weight.
     */
    private function syncProfileCurrentWeight(int $userId): void
    {
        $latestLog = WeightLog::query()
            ->where('user_id', $userId)
            ->orderByDesc('logged_on')
            ->orderByDesc('created_at')
            ->first();

        if (! $latestLog) {
            return;
        }

        $latestLog->user
            ->profile()
            ->update([
                'current_weight_kg' => $latestLog->weight_kg,
            ]);
    }
}