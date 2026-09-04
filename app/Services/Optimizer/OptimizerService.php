<?php

namespace App\Services\Optimizer;

use App\Models\Allocation;
use App\Models\Employee;
use App\Models\Project;

class OptimizerService
{
    public function __construct(
        private AllocatorService $allocatorService
    ) {
    }

    public function run(array $projectIds = []): array
    {
        $projectQuery = Project::with('skillRequirements')
            ->whereIn('status', ['planning', 'active']);

        if (!empty($projectIds)) {
            $projectQuery->whereIn('id', $projectIds);
        }

        $projects = $projectQuery->get();
        $employees = Employee::with(['skills', 'allocations', 'preferences'])->get();

        $proposals = $this->allocatorService->allocate($projects, $employees);

        return [
            'proposals' => $proposals,
            'summary' => $this->buildSummary($proposals, $projects, $employees),
            'created_at' => now()->toIso8601String(),
        ];
    }

    public function acceptProposals(array $proposals): int
    {
        $count = 0;

        foreach ($proposals as $proposal) {
            Allocation::create([
                'employee_id' => $proposal['employee_id'],
                'project_id' => $proposal['project_id'],
                'allocated_hours' => $proposal['allocated_hours'],
                'start_date' => now(),
                'end_date' => now()->addWeeks(4),
                'status' => 'confirmed',
                'assignment_reason' => $proposal['assignment_reason'] ?? null,
                'allocation_score' => $proposal['allocation_score'] ?? null,
            ]);
            $count++;
        }

        return $count;
    }

    private function buildSummary(array $proposals, $projects, $employees): array
    {
        $totalProposals = count($proposals);
        $avgScore = $totalProposals > 0
            ? round(collect($proposals)->avg('allocation_score'), 2)
            : 0;

        $projectsCovered = collect($proposals)->pluck('project_id')->unique()->count();
        $employeesAssigned = collect($proposals)->pluck('employee_id')->unique()->count();

        return [
            'total_proposals' => $totalProposals,
            'average_score' => $avgScore,
            'projects_covered' => $projectsCovered . ' / ' . $projects->count(),
            'employees_assigned' => $employeesAssigned . ' / ' . $employees->count(),
        ];
    }
}