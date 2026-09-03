<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Allocation;
use App\Models\Skill;

class DashboardController extends Controller
{
    public function overview()
    {
        $employees = Employee::with(['skills', 'allocations', 'preferences'])->get();
        $projects = Project::with(['skillRequirements', 'allocations'])->get();

        $totalEmployees = $employees->count();
        $activeProjects = $projects->where('status', 'active')->count();

        $avgUtilization = $totalEmployees > 0
            ? round($employees->avg('utilization_percentage'), 1)
            : 0;

        $overallocated = $employees->filter(fn($e) => $e->utilization_percentage > 100)->count();
        $underutilized = $employees->filter(fn($e) => $e->utilization_percentage < 30)->count();

        return response()->json([
            'total_employees' => $totalEmployees,
            'active_projects' => $activeProjects,
            'avg_utilization' => $avgUtilization,
            'overallocated' => $overallocated,
            'underutilized' => $underutilized,
            'employees' => $employees,
            'projects' => $projects,
        ]);
    }
}