<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allocation extends Model
{
    use HasFactory;
    protected $fillable = [
        'employee_id',
        'project_id',
        'allocated_hours',
        'start_date',
        'end_date',
        'status',
        'assignment_reason',
        'allocation_score',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'allocation_score' => 'float',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('organization', function ($builder) {
            if (auth()->check() && auth()->user()->organization_id) {
                $builder->whereHas('employee', function ($q) {
                    $q->where('employees.organization_id', auth()->user()->organization_id);
                });
            }
        });
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
