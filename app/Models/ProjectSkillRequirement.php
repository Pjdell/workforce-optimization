<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;

class ProjectSkillRequirement extends Model
{
    protected $table = 'project_skill_requirements';

    protected $fillable = [
        'project_id',
        'skill_id',
        'required_proficiency',
        'required_hours',

    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
    public function skill()
    {
        return $this->belongsTo(Skill::class);
    }



}
