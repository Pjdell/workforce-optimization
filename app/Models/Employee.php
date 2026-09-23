<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory, BelongsToOrganization;

    protected $fillable = [
        'user_id',
        'organization_id',
        'name',
        'email',
        'role',
        'department',
        'max_weekly_hours',
        'remote_preference',
        'availability_start',
        'availability_end',
    ];

    protected $casts = [
        'availability_start' => 'date',
        'availability_end' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'employee_skill')
            ->withPivot('proficiency_level', 'years_of_experience')
            ->withTimestamps();
    }

    public function allocations()
    {
        return $this->hasMany(Allocation::class);
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class);
    }
    public function preferences()
    {
        return $this->hasOne(EmployeePreference::class);
    }

    public function getCurrentWorkloadAttribute()
    {
        return $this->allocations()
            ->whereIn('status', ['proposed', 'confirmed'])
            ->sum('allocated_hours');
    }
    public function getRemainingCapacityAttribute(): int
    {
        $maxHours = $this->preferences?->max_weekly_hours_override
            ?? $this->max_weekly_hours;
        return max(0, $maxHours - $this->current_workload);
    }

    public function getUtilizationPercentageAttribute(): float
    {
        $maxHours = $this->preferences?->max_weekly_hours_override
            ?? $this->max_weekly_hours;
        if ($maxHours === 0)
            return 0;
        return round(($this->current_workload / $maxHours) * 100, 1);
    }
    protected $appends = ['current_workload', 'remaining_capacity', 'utilization_percentage'];
}

