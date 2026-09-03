<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with('skillRequirements');

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:planning,active,on_hold,completed',
            'priority' => 'in:low,medium,high,critical',
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date|after_or_equal:start_date',
            'estimated_hours' => 'integer|min:0',
        ]);

        $project = Project::create($validated);
        return response()->json($project->load('skillRequirements'), 201);
    }

    public function show(Project $project)
    {
        return $project->load(['skillRequirements', 'allocations.employee']);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:planning,active,on_hold,completed',
            'priority' => 'in:low,medium,high,critical',
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date|after_or_equal:start_date',
            'estimated_hours' => 'integer|min:0',
        ]);

        $project->update($validated);
        return response()->json($project->load('skillRequirements'));
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(null, 204);
    }

    /**
     * Set skill requirements for a project.
     * Expects: { "requirements": [{ "skill_id": 1, "required_proficiency": "advanced", "required_hours": 40 }] }
     */
    public function setRequirements(Request $request, Project $project)
    {
        $validated = $request->validate([
            'requirements' => 'required|array',
            'requirements.*.skill_id' => 'required|exists:skills,id',
            'requirements.*.required_proficiency' => 'required|in:beginner,intermediate,advanced,expert',
            'requirements.*.required_hours' => 'integer|min:0',
        ]);

        $syncData = [];
        foreach ($validated['requirements'] as $req) {
            $syncData[$req['skill_id']] = [
                'required_proficiency' => $req['required_proficiency'],
                'required_hours' => $req['required_hours'] ?? 0,
            ];
        }

        $project->skillRequirements()->sync($syncData);
        return response()->json($project->load('skillRequirements'));
    }
}