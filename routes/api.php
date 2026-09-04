<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\SkillController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\AllocationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OptimizeController;
use App\Http\Controllers\Api\AnalyticsController;
use Illuminate\Support\Facades\Route;

// ── CRUD Resources ─────────────────────────────────────────
Route::apiResource('employees', EmployeeController::class);
Route::post('employees/{employee}/skills', [EmployeeController::class, 'attachSkills']);

Route::apiResource('skills', SkillController::class);

Route::apiResource('projects', ProjectController::class);
Route::post('projects/{project}/requirements', [ProjectController::class, 'setRequirements']);

Route::apiResource('allocations', AllocationController::class);

// ── Dashboard ──────────────────────────────────────────────
Route::get('dashboard/overview', [DashboardController::class, 'overview']);

// ── Optimizer ──────────────────────────────────────────────
Route::post('optimize', [OptimizeController::class, 'run']);
Route::get('optimize/results/{id}', [OptimizeController::class, 'results']);
Route::post('optimize/accept', [OptimizeController::class, 'accept']);

// ── Analytics ──────────────────────────────────────────────
Route::get('analytics/utilization', [AnalyticsController::class, 'utilization']);
Route::get('analytics/skill-gaps', [AnalyticsController::class, 'skillGaps']);
Route::get('analytics/overallocated', [AnalyticsController::class, 'overallocated']);
Route::get('analytics/underutilized', [AnalyticsController::class, 'underutilized']);
Route::get('analytics/project-coverage', [AnalyticsController::class, 'projectCoverage']);

// ── Simulations (Phase 4) ──────────────────────────────────
Route::post('simulate', [OptimizeController::class, 'simulate']);
Route::post('simulate/compare', [OptimizeController::class, 'compare']);