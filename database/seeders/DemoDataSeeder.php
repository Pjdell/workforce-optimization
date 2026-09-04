<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Skill;
use App\Models\Project;
use App\Models\EmployeePreference;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Skills ──────────────────────────────────────
        $skills = [
            ['name' => 'PHP', 'category' => 'Backend'],
            ['name' => 'Laravel', 'category' => 'Backend'],
            ['name' => 'JavaScript', 'category' => 'Frontend'],
            ['name' => 'React', 'category' => 'Frontend'],
            ['name' => 'TypeScript', 'category' => 'Frontend'],
            ['name' => 'Vue.js', 'category' => 'Frontend'],
            ['name' => 'Python', 'category' => 'Backend'],
            ['name' => 'PostgreSQL', 'category' => 'Database'],
            ['name' => 'MySQL', 'category' => 'Database'],
            ['name' => 'Docker', 'category' => 'DevOps'],
            ['name' => 'AWS', 'category' => 'DevOps'],
            ['name' => 'Figma', 'category' => 'Design'],
            ['name' => 'Tailwind CSS', 'category' => 'Frontend'],
            ['name' => 'Node.js', 'category' => 'Backend'],
            ['name' => 'Redis', 'category' => 'Database'],
        ];

        foreach ($skills as $skill) {
            Skill::create($skill);
        }

        $allSkills = Skill::all();
        $proficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];

        // ── Employees ───────────────────────────────────
        $employeeData = [
            ['name' => 'Alice Chen', 'role' => 'Senior Developer', 'department' => 'Engineering'],
            ['name' => 'Bob Martinez', 'role' => 'Full Stack Dev', 'department' => 'Engineering'],
            ['name' => 'Carol Nguyen', 'role' => 'Frontend Dev', 'department' => 'Engineering'],
            ['name' => 'David Kim', 'role' => 'Backend Dev', 'department' => 'Engineering'],
            ['name' => 'Eva Patel', 'role' => 'DevOps Engineer', 'department' => 'Infrastructure'],
            ['name' => 'Frank Lopez', 'role' => 'UI/UX Designer', 'department' => 'Design'],
            ['name' => 'Grace Wang', 'role' => 'Junior Developer', 'department' => 'Engineering'],
            ['name' => 'Henry Brooks', 'role' => 'Tech Lead', 'department' => 'Engineering'],
            ['name' => 'Iris Taylor', 'role' => 'QA Engineer', 'department' => 'Quality'],
            ['name' => 'Jack Wilson', 'role' => 'Data Engineer', 'department' => 'Data'],
        ];

        foreach ($employeeData as $data) {
            $employee = Employee::create([
                'name' => $data['name'],
                'email' => strtolower(str_replace(' ', '.', $data['name'])) . '@company.com',
                'role' => $data['role'],
                'department' => $data['department'],
                'max_weekly_hours' => rand(30, 40),
                'remote_preference' => ['remote', 'onsite', 'hybrid'][array_rand(['remote', 'onsite', 'hybrid'])],
                'availability_start' => now()->subMonths(rand(1, 6)),
                'availability_end' => now()->addMonths(rand(3, 12)),
            ]);

            // Attach 3–6 random skills
            $randomSkills = $allSkills->random(rand(3, 6));
            foreach ($randomSkills as $skill) {
                $employee->skills()->attach($skill->id, [
                    'proficiency_level' => $proficiencies[array_rand($proficiencies)],
                    'years_of_experience' => rand(1, 10) + (rand(0, 1) * 0.5),
                ]);
            }

            // Add preferences
            EmployeePreference::create([
                'employee_id' => $employee->id,
                'preferred_technologies' => $randomSkills->random(min(2, $randomSkills->count()))->pluck('name')->toArray(),
                'preferred_project_type' => ['web', 'mobile', 'data', 'infrastructure'][array_rand(['web', 'mobile', 'data', 'infrastructure'])],
            ]);
        }

        // ── Projects ────────────────────────────────────
        $projectData = [
            ['name' => 'E-Commerce Platform Redesign', 'priority' => 'critical', 'hours' => 200],
            ['name' => 'Mobile App API v2', 'priority' => 'high', 'hours' => 150],
            ['name' => 'Internal Dashboard', 'priority' => 'medium', 'hours' => 100],
            ['name' => 'Data Pipeline Migration', 'priority' => 'high', 'hours' => 120],
            ['name' => 'Landing Page Refresh', 'priority' => 'low', 'hours' => 40],
        ];

        foreach ($projectData as $data) {
            $project = Project::create([
                'name' => $data['name'],
                'description' => "Project: {$data['name']}",
                'status' => 'active',
                'priority' => $data['priority'],
                'start_date' => now(),
                'deadline' => now()->addMonths(rand(2, 6)),
                'estimated_hours' => $data['hours'],
            ]);

            // Attach 2–4 random skill requirements
            $reqSkills = $allSkills->random(rand(2, 4));
            foreach ($reqSkills as $skill) {
                $project->skillRequirements()->attach($skill->id, [
                    'required_proficiency' => $proficiencies[array_rand($proficiencies)],
                    'required_hours' => rand(10, 50),
                ]);
            }
        }
    }
}