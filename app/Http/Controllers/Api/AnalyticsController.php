<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Skill;

class AnalyticsController extends Controller
{
    public function utilization()
    {
        $employees = Employee::with(['allocations', 'preferences'])->get();

        return $employees->map(fn($e) => [
            'id' => $e->id,
            'name' => $e->name,
            'department' => $e->department,
            'max_weekly_hours' => $e->max_weekly_hours,
            'current_workload' => $e->current_workload,
            'remaining_capacity' => $e->remaining_capacity,
            'utilization_percentage' => $e->utilization_percentage,
        ]);
    }

    public function skillGaps()
    {
        $skills = Skill::withCount(['employees', 'projectRequirements'])->get();

        return $skills->map(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'category' => $s->category,
            'supply' => $s->employees_count,
            'demand' => $s->project_requirements_count,
            'gap' => $s->employees_count - $s->project_requirements_count,
        ]);
    }

    public function overallocated()
    {
        $employees = Employee::with(['allocations', 'preferences'])->get();

        return $employees
            ->filter(fn($e) => $e->utilization_percentage > 100)
            ->values()
            ->map(fn($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'utilization_percentage' => $e->utilization_percentage,
                'current_workload' => $e->current_workload,
                'max_weekly_hours' => $e->max_weekly_hours,
            ]);
    }

    public function underutilized()
    {
        $employees = Employee::with(['allocations', 'preferences'])->get();

        return $employees
            ->filter(fn($e) => $e->utilization_percentage < 30)
            ->values()
            ->map(fn($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'utilization_percentage' => $e->utilization_percentage,
                'remaining_capacity' => $e->remaining_capacity,
            ]);
    }

    public function projectCoverage()
    {
        $projects = Project::with(['skillRequirements', 'allocations'])->get();

        return $projects->map(fn($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'priority' => $p->priority,
            'status' => $p->status,
            'estimated_hours' => $p->estimated_hours,
            'staffing_coverage' => $p->staffing_coverage,
        ]);
    }
}