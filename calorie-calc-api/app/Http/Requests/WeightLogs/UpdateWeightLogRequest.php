<?php

namespace App\Http\Requests\WeightLogs;

class UpdateWeightLogRequest extends StoreWeightLogRequest
{
    /**
     * Same rules as store because PUT replaces the weight log values.
     */
}