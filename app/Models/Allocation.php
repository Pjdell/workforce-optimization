<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allocation extends Model
{
    use HasFactory;
    protected $fillable = [
        'emmployee_id',
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

    public function employee()
    {
        return $this->belongsToMany(Employee::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
