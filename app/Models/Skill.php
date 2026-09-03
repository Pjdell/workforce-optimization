<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'category'];

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_skill')
            ->withPivot('proficiency_level', 'years_of_experience')
            ->withTimeStamps();
    }
    public function projectRequirements()
    {
        return $this->hasMany(ProjectSkillRequirement::class);
    }

}
