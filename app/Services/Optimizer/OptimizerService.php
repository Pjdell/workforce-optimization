<?php

namespace App\Services\Optimizer;

use App\Models\Allocation;
use App\Models\Employee;
use App\Models\Project;

class OptimizerService
{
    /**
     * Run the workforce optimization algorithm for the given projects.
     *
     * Scores each employee–project pair based on skill match and remaining
     * capacity, then returns a ranked list of proposed allocations.
     *
     * @param  array  $projectIds  Filter to these projects (empty = all active).
     * @return array{proposals: array, summary: array}
     */
    public function run(array $projectIds = []): array
    {
        $projects = Project::with('skillRequirement')
            ->when(!empty($projectIds), fn ($q) => $q->whereIn('id', $projectIds))
            ->where('status', 'active')
            ->get();

        $employees = Employee::with(['skills', 'preferences', 'allocations'])->get();

        $proposals = [];

        foreach ($projects as $project) {
            $requiredSkills = $project->skillRequirement;

            foreach ($requiredSkills as $skillPivot) {
                $candidates = $this->rankCandidates($employees, $skillPivot);

                foreach ($candidates as $candidate) {
                    $proposals[] = [
                        'employee_id'       => $candidate['employee']->id,
                        'employee_name'     => $candidate['employee']->name,
                        'project_id'        => $project->id,
                        'project_name'      => $project->name,
                        'skill'             => $skillPivot->pivot->skill_id ?? $skillPivot->skill_id ?? null,
                        'allocated_hours'   => $candidate['suggested_hours'],
                        'allocation_score'  => $candidate['score'],
                        'assignment_reason' => $candidate['reason'],
                    ];
                }
            }
        }

        // Sort proposals by score descending
        usort($proposals, fn ($a, $b) => $b['allocation_score'] <=> $a['allocation_score']);

        return [
            'proposals' => $proposals,
            'summary'   => [
                'projects_evaluated'  => $projects->count(),
                'employees_evaluated' => $employees->count(),
                'proposals_generated' => count($proposals),
            ],
        ];
    }

    /**
     * Accept and persist an array of proposed allocations.
     *
     * @param  array  $proposals
     * @return int  Number of allocations created.
     */
    public function acceptProposals(array $proposals): int
    {
        $count = 0;

        foreach ($proposals as $proposal) {
            Allocation::create([
                'employee_id'       => $proposal['employee_id'],
                'project_id'        => $proposal['project_id'],
                'allocated_hours'   => $proposal['allocated_hours'],
                'status'            => 'proposed',
                'assignment_reason' => $proposal['assignment_reason'] ?? null,
                'allocation_score'  => $proposal['allocation_score'] ?? null,
            ]);

            $count++;
        }

        return $count;
    }

    /**
     * Rank employees for a given skill requirement.
     *
     * @return array  Sorted list of candidate arrays with score, reason, and suggested hours.
     */
    private function rankCandidates($employees, $skillRequirement): array
    {
        $skillId             = $skillRequirement->skill_id;
        $requiredProficiency = $skillRequirement->required_proficiency ?? 1;
        $requiredHours       = $skillRequirement->required_hours ?? 0;

        $candidates = [];

        foreach ($employees as $employee) {
            $matchedSkill = $employee->skills->firstWhere('id', $skillId);

            if (!$matchedSkill) {
                continue;
            }

            $proficiency = $matchedSkill->pivot->proficiency_level ?? 0;
            $experience  = $matchedSkill->pivot->years_of_experience ?? 0;
            $capacity    = $employee->remaining_capacity;

            if ($capacity <= 0) {
                continue;
            }

            // Score: proficiency fit (0–50) + experience bonus (0–30) + capacity bonus (0–20)
            $proficiencyScore = min(50, ($proficiency / max($requiredProficiency, 1)) * 50);
            $experienceScore  = min(30, $experience * 5);
            $capacityScore    = min(20, ($capacity / max($requiredHours, 1)) * 20);
            $totalScore       = round($proficiencyScore + $experienceScore + $capacityScore, 2);

            $suggestedHours = min($capacity, $requiredHours ?: $capacity);

            $candidates[] = [
                'employee'        => $employee,
                'score'           => $totalScore,
                'suggested_hours' => $suggestedHours,
                'reason'          => "Skill proficiency {$proficiency}/{$requiredProficiency}, "
                    . "{$experience}yr experience, {$capacity}h available",
            ];
        }

        // Best candidates first
        usort($candidates, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $candidates;
    }
}
