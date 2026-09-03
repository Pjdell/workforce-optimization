<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Allocation;
use Illuminate\Http\Request;

class AllocationController extends Controller
{

    public function index(Request $request)
    {
        $query = Allocation::with(['employee', 'project']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->has('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }
        return $query->get();


    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validate = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'project_id' => 'required|exists:projects,id',
            'allocated_hours' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'in:proposed,confirmed,completed',
            'assignment_reason' => 'nullable|string',
            'allocation_score' => 'nullable|numeric|min:0|max:100',
        ]);

        $allocation = Allocation::create($validate);
        return response()->json($allocation->load(['employee_id', 'project_id']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Allocation $allocation)
    {
        return $allocation->load(['employee.skill', 'project.skillRequirements']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Allocation $allocation)
    {
        $validated = $request->validate([
            'allocated_hours' => 'integer|min:1',
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date',
            'status' => 'in:proposed,confirmed,completed',
            'assignment_reason' => 'nullable|string',
            'allocation_score' => 'nullable|numeric|min:0|max:100',
        ]);

        $allocation->update($validated);
        return response()->json($allocation->load(['employee', 'project']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Allocation $allocation)
    {
        $allocation->delete();
        return response()->json(null, 204);
    }
}
