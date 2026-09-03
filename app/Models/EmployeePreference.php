<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeePreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'emmployee_id',
        'preferred_technologies',
        'preferred_project_type',
        'max_weekly_hours_override',
    ];

    protected $casts = [
        'preferred_technologies' => 'array',

    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
