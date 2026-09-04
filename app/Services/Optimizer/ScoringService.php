<?php

namespace App\Services\Optimizer;

use App\Models\Employee;
use App\Models\Project;
use Illuminate\Support\Collection;

class ScoringService
{
    private const WEIGHTS = [
        'skill_match' => 0.50,
        'availability' => 0.20,
        'workload_balance' => 0.15,
        'experience' => 0.10,
        'preference' => 0.05,
    ];

    public function compositeScore(
        Employee $employee,
        Project $project,
        Collection $allEmployees
    ): array {
        $scores = [
            'skill_match' => $this->calculateSkillMatch($employee, $project),
            'availability' => $this->calculateAvailability($employee),
            'workload_balance' => $this->calculateWorkloadBalance($employee, $allEmployees),
            'experience' => $this->calculateExperienceScore($employee, $project),
            'preference' => $this->calculatePreferenceScore($employee, $project),
        ];

        $total = 0;
        $reasons = [];

        foreach ($scores as $key => $result) {
            $total += $result['score'] * self::WEIGHTS[$key];
            $reasons[] = $result['reason'];
        }

        return [
            'score' => round($total, 2),
            'details' => $scores,
            'reasons' => $reasons,
        ];
    }

    public function calculateSkillMatch(Employee $employee, Project $project): array
    {
        $requirements = $project->skillRequirements;
        if ($requirements->isEmpty()) {
            return ['score' => 50, 'reason' => 'No specific skills required — default match'];
        }

        $proficiencyMap = [
            'beginner' => 1,
            'intermediate' => 2,
            'advanced' => 3,
            'expert' => 4,
        ];

        $matched = 0;
        $matchDetails = [];

        foreach ($requirements as $req) {
            $employeeSkill = $employee->skills->firstWhere('id', $req->id);
            if ($employeeSkill) {
                $empLevel = $proficiencyMap[$employeeSkill->pivot->proficiency_level] ?? 0;
                $reqLevel = $proficiencyMap[$req->pivot->required_proficiency] ?? 0;
                if ($empLevel >= $reqLevel) {
                    $matched++;
                    $matchDetails[] = "{$req->name}: {$employeeSkill->pivot->proficiency_level} ✓";
                } else {
                    $matchDetails[] = "{$req->name}: {$employeeSkill->pivot->proficiency_level} (needs {$req->pivot->required_proficiency}) ✗";
                }
            } else {
                $matchDetails[] = "{$req->name}: missing ✗";
            }
        }

        $score = ($matched / $requirements->count()) * 100;
        $reason = round($score) . "% skill match (" . implode(', ', $matchDetails) . ")";

        return ['score' => round($score, 2), 'reason' => $reason];
    }

    public function calculateAvailability(Employee $employee): array
    {
        $now = now();

        if ($employee->availability_end && $employee->availability_end->lt($now)) {
            return ['score' => 0, 'reason' => 'Availability ended on ' . $employee->availability_end->format('M d, Y')];
        }

        if ($employee->availability_start && $employee->availability_start->gt($now)) {
            return ['score' => 30, 'reason' => 'Available starting ' . $employee->availability_start->format('M d, Y')];
        }

        $remaining = $employee->remaining_capacity;
        $max = $employee->max_weekly_hours;
        $score = $max > 0 ? ($remaining / $max) * 100 : 0;

        return [
            'score' => round($score, 2),
            'reason' => "{$remaining} hours available out of {$max} hr capacity",
        ];
    }

    public function calculateWorkloadBalance(Employee $employee, Collection $allEmployees): array
    {
        $utilization = $employee->utilization_percentage;
        $score = max(0, 100 - $utilization);

        $suffix = '';
        if ($utilization < 50)
            $suffix = ' — room for more work';
        elseif ($utilization > 80)
            $suffix = ' — nearing capacity';

        return [
            'score' => round($score, 2),
            'reason' => "Current utilization: {$utilization}%" . $suffix,
        ];
    }

    public function calculateExperienceScore(Employee $employee, Project $project): array
    {
        $requirements = $project->skillRequirements;
        if ($requirements->isEmpty()) {
            return ['score' => 50, 'reason' => 'No skill requirements to evaluate experience'];
        }

        $totalYears = 0;
        $count = 0;

        foreach ($requirements as $req) {
            $employeeSkill = $employee->skills->firstWhere('id', $req->id);
            if ($employeeSkill) {
                $totalYears += $employeeSkill->pivot->years_of_experience;
                $count++;
            }
        }

        $avgYears = $count > 0 ? $totalYears / $count : 0;
        $score = min(100, $avgYears * 15);

        return [
            'score' => round($score, 2),
            'reason' => "Average " . round($avgYears, 1) . " years experience in required skills",
        ];
    }

    public function calculatePreferenceScore(Employee $employee, Project $project): array
    {
        $prefs = $employee->preferences;
        if (!$prefs || empty($prefs->preferred_technologies)) {
            return ['score' => 50, 'reason' => 'No technology preferences set — neutral score'];
        }

        $requiredSkillNames = $project->skillRequirements->pluck('name')->map(fn($n) => strtolower($n));
        $preferredTech = collect($prefs->preferred_technologies)->map(fn($t) => strtolower($t));

        $overlap = $preferredTech->intersect($requiredSkillNames)->count();
        $total = $requiredSkillNames->count();
        $score = $total > 0 ? ($overlap / $total) * 100 : 50;

        return [
            'score' => round($score, 2),
            'reason' => "{$overlap} of {$total} required skills match employee preferences",
        ];
    }
}