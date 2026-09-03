<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with(['skills', 'preferences']);

        // Search
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('department', 'ilike', "%{$search}%");
            });
        }

        // Filter by department
        if ($request->has('department')) {
            $query->where('department', $request->input('department'));
        }

        // Filter by skill
        if ($request->has('skill_id')) {
            $query->whereHas('skills', function ($q) use ($request) {
                $q->where('skills.id', $request->input('skill_id'));
            });
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees',
            'role' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'max_weekly_hours' => 'integer|min:1|max:168',
            'remote_preference' => 'in:remote,onsite,hybrid',
            'availability_start' => 'nullable|date',
            'availability_end' => 'nullable|date|after_or_equal:availability_start',
        ]);

        $employee = Employee::create($validated);
        return response()->json($employee->load(['skills', 'preferences']), 201);
    }

    public function show(Employee $employee)
    {
        return $employee->load(['skills', 'allocations.project', 'preferences']);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:employees,email,' . $employee->id,
            'role' => 'string|max:255',
            'department' => 'string|max:255',
            'max_weekly_hours' => 'integer|min:1|max:168',
            'remote_preference' => 'in:remote,onsite,hybrid',
            'availability_start' => 'nullable|date',
            'availability_end' => 'nullable|date|after_or_equal:availability_start',
        ]);

        $employee->update($validated);
        return response()->json($employee->load(['skills', 'preferences']));
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->json(null, 204);
    }

    /**
     * Attach skills to an employee.
     * Expects: { "skills": [{ "skill_id": 1, "proficiency_level": "advanced", "years_of_experience": 3 }] }
     */
    public function attachSkills(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'skills' => 'required|array',
            'skills.*.skill_id' => 'required|exists:skills,id',
            'skills.*.proficiency_level' => 'required|in:beginner,intermediate,advanced,expert',
            'skills.*.years_of_experience' => 'numeric|min:0',
        ]);

        $syncData = [];
        foreach ($validated['skills'] as $skill) {
            $syncData[$skill['skill_id']] = [
                'proficiency_level' => $skill['proficiency_level'],
                'years_of_experience' => $skill['years_of_experience'] ?? 0,
            ];
        }

        $employee->skills()->sync($syncData);
        return response()->json($employee->load('skills'));
    }
}