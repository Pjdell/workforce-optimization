<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    public function index()
    {
        return Skill::withCount(['employees', 'projectRequirements'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:skills',
            'category' => 'required|string|max:255',
        ]);

        $skill = Skill::create($validated);
        return response()->json($skill, 201);
    }

    public function show(Skill $skill)
    {
        return $skill->load(['employees', 'projectRequirements.project']);
    }

    public function update(Request $request, Skill $skill)
    {
        $validated = $request->validate([
            'name' => 'string|max:255|unique:skills,name,' . $skill->id,
            'category' => 'string|max:255',
        ]);

        $skill->update($validated);
        return response()->json($skill);
    }

    public function destroy(Skill $skill)
    {
        $skill->delete();
        return response()->json(null, 204);
    }
}