<?php

namespace App\Models;

use App\Traits\BelongsToOrganization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory, BelongsToOrganization;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'status',
        'priority',
        'start_date',
        'deadline',
        'estimated_hours',
    ];

    protected $casts = [
        'start_date' => 'date',
        'deadline' => 'date',
    ];

    public function skillRequirements()
    {
        return $this->belongsToMany(Skill::class, 'projects_skill_requirements')
            ->withPivot('required_proficiency', 'required_hours')
            ->withTimestamps();
    }

    public function allocations()
    {
        return $this->hasMany(Allocation::class);
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'allocations');

    }

    public function getStaffingCoverageAttribute(): float
    {
        if ($this->estimated_hours == 0)
            return 0;
        $allocated = $this->allocations()
            ->whereIn('status', ['proposed', 'confirmed'])
            ->sum('allocated_hours');
        return round(($allocated / $this->estimated_hours) * 100, 1);
    }

    protected $appends = ['staffing_coverage'];


}
