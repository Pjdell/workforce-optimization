<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\AllocationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OptimizeController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Support\Facades\Route;

// ── Public Auth Routes ────────────────────────────────────────
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

// ── Public Invitation Routes ──────────────────────────────────
Route::get('invitations/verify/{token}', [InvitationController::class, 'verify']);
Route::post('invitations/accept', [InvitationController::class, 'accept']);

// ── Protected Routes (require authentication) ─────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('user', [AuthController::class, 'user']);
    Route::post('logout', [AuthController::class, 'logout']);

    // ── Employee Self-Service ──────────────────────────────────
    Route::get('my-profile', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee profile found.'], 404);
        }

        return response()->json(
            $employee->load(['skills', 'preferences', 'allocations.project'])
        );
    });

    Route::put('my-profile', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee profile found.'], 404);
        }

        $validated = $request->validate([
            'max_weekly_hours' => 'integer|min:1|max:168',
            'remote_preference' => 'in:remote,onsite,hybrid',
            'availability_start' => 'nullable|date',
            'availability_end' => 'nullable|date|after_or_equal:availability_start',
        ]);

        $employee->update($validated);
        return response()->json($employee->load(['skills', 'preferences']));
    });

    Route::post('my-profile/skills', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'No employee profile found.'], 404);
        }

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
    });

    // ── Admin-Only Routes ──────────────────────────────────────
    Route::middleware(EnsureUserIsAdmin::class)->group(function () {
        // Invitations
        Route::get('invitations', [InvitationController::class, 'index']);
        Route::post('invitations', [InvitationController::class, 'store']);
        Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy']);

        // CRUD Resources
        Route::apiResource('employees', EmployeeController::class);
        Route::post('employees/{employee}/skills', [EmployeeController::class, 'attachSkills']);

        Route::apiResource('skills', SkillController::class);

        Route::apiResource('projects', ProjectController::class);
        Route::post('projects/{project}/requirements', [ProjectController::class, 'setRequirements']);

        Route::apiResource('allocations', AllocationController::class);

        // Dashboard
        Route::get('dashboard/overview', [DashboardController::class, 'overview']);

        // Optimizer
        Route::post('optimize', [OptimizeController::class, 'run']);
        Route::get('optimize/results/{id}', [OptimizeController::class, 'results']);
        Route::post('optimize/accept', [OptimizeController::class, 'accept']);

        // Analytics
        Route::get('analytics/utilization', [AnalyticsController::class, 'utilization']);
        Route::get('analytics/skill-gaps', [AnalyticsController::class, 'skillGaps']);
        Route::get('analytics/overallocated', [AnalyticsController::class, 'overallocated']);
        Route::get('analytics/underutilized', [AnalyticsController::class, 'underutilized']);
        Route::get('analytics/project-coverage', [AnalyticsController::class, 'projectCoverage']);

        // Simulations (Phase 4)
        Route::post('simulate', [OptimizeController::class, 'simulate']);
        Route::post('simulate/compare', [OptimizeController::class, 'compare']);
    });

    // ── Read-only routes for employees ─────────────────────────
    Route::get('skills', [SkillController::class, 'index']);
});