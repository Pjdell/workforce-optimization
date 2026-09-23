<?php

namespace App\Services\Optimizer;

use App\Models\Employee;
use App\Models\Project;
use Illuminate\Support\Collection;

class AllocatorService
{
    public function __construct(
        private ScoringService $scoringService
    ) {
    }

    public function allocate(Collection $projects, Collection $employees): array
    {
        $priorityOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];

        $sortedProjects = $projects->sortBy(
            fn(Project $p) => $priorityOrder[$p->priority] ?? 99
        );

        $capacityTracker = [];
        foreach ($employees as $emp) {
            $capacityTracker[$emp->id] = $emp->remaining_capacity;
        }

        $proposedAllocations = [];

        foreach ($sortedProjects as $project) {
            $candidates = [];

            foreach ($employees as $employee) {
                if ($capacityTracker[$employee->id] <= 0) {
                    continue;
                }

                $result = $this->scoringService->compositeScore($employee, $project, $employees);

                // Skip employees with zero skill match when the project has requirements
                if ($result['details']['skill_match']['score'] <= 0 && $project->skillRequirements->isNotEmpty()) {
                    continue;
                }

                $candidates[] = [
                    'employee' => $employee,
                    'score' => $result['score'],
                    'reasons' => $result['reasons'],
                    'details' => $result['details'],
                ];
            }

            usort($candidates, fn($a, $b) => $b['score'] <=> $a['score']);

            $remainingProjectHours = $project->estimated_hours;

            foreach ($candidates as $candidate) {
                if ($remainingProjectHours <= 0)
                    break;

                $empId = $candidate['employee']->id;
                $availableHours = $capacityTracker[$empId];
                $allocateHours = min($availableHours, $remainingProjectHours);

                if ($allocateHours <= 0)
                    continue;

                $proposedAllocations[] = [
                    'employee_id' => $empId,
                    'employee_name' => $candidate['employee']->name,
                    'project_id' => $project->id,
                    'project_name' => $project->name,
                    'allocated_hours' => $allocateHours,
                    'allocation_score' => $candidate['score'],
                    'assignment_reason' => implode(' | ', $candidate['reasons']),
                    'score_details' => $candidate['details'],
                    'status' => 'proposed',
                ];

                $capacityTracker[$empId] -= $allocateHours;
                $remainingProjectHours -= $allocateHours;
            }
        }

        return $proposedAllocations;
    }
}