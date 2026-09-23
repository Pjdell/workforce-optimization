<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Model;

class ProjectSkillRequirement extends Model
{
    protected $table = 'projects_skill_requirements';

    protected $fillable = [
        'project_id',
        'skill_id',
        'required_proficiency',
        'required_hours',

    ];

    protected static function booted(): void
    {
        static::addGlobalScope('organization', function ($builder) {
            if (auth()->check() && auth()->user()->organization_id) {
                $builder->whereHas('project', function ($q) {
                    $q->where('projects.organization_id', auth()->user()->organization_id);
                });
            }
        });
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
    public function skill()
    {
        return $this->belongsTo(Skill::class);
    }



}
