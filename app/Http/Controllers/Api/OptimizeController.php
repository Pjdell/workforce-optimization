<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Optimizer\OptimizerService;
use Illuminate\Http\Request;

class OptimizeController extends Controller
{
    public function __construct(
        private OptimizerService $optimizerService
    ) {
    }

    public function run(Request $request)
    {
        $projectIds = $request->input('project_ids', []);

        $results = $this->optimizerService->run($projectIds);

        return response()->json($results);
    }

    public function results(string $id)
    {
        // For now, optimization results are returned immediately (no persistence)
        // In Phase 4, store results in a cache/table and retrieve by ID
        return response()->json(['message' => 'Use POST /api/optimize to get results'], 200);
    }

    public function accept(Request $request)
    {
        $validated = $request->validate([
            'proposals' => 'required|array',
            'proposals.*.employee_id' => 'required|exists:employees,id',
            'proposals.*.project_id' => 'required|exists:projects,id',
            'proposals.*.allocated_hours' => 'required|integer|min:1',
            'proposals.*.assignment_reason' => 'nullable|string',
            'proposals.*.allocation_score' => 'nullable|numeric',
        ]);

        $count = $this->optimizerService->acceptProposals($validated['proposals']);

        return response()->json([
            'message' => "{$count} allocations created successfully",
            'count' => $count,
        ]);
    }

    public function simulate(Request $request)
    {
        // Phase 4 — placeholder
        return response()->json(['message' => 'Simulation feature coming in Phase 4'], 501);
    }

    public function compare(Request $request)
    {
        // Phase 4 — placeholder
        return response()->json(['message' => 'Comparison feature coming in Phase 4'], 501);
    }
}