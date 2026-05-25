<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'is_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function nutritionGoals(): HasMany
    {
        return $this->hasMany(NutritionGoal::class);
    }

    public function activeNutritionGoal(): HasOne
    {
        return $this->hasOne(NutritionGoal::class)->where('is_active', true);
    }

    public function weightLogs(): HasMany
    {
        return $this->hasMany(WeightLog::class);
    }

    public function mealEntries(): HasMany
    {
        return $this->hasMany(MealEntry::class);
    }

    public function favoriteFoods(): BelongsToMany
    {
        return $this
            ->belongsToMany(Food::class, 'user_favorite_foods')
            ->withTimestamps();
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $panel->getId() === 'calc-admin' && $this->is_admin;
    }
}
