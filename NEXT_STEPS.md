# Workforce Optimizer — Step-by-Step Implementation Guide

> **Start here.** This document tells you exactly what to type, in order, to build the full application from the current blank Laravel scaffold. Every command and every file is listed. Work through each step sequentially.
>
> Reference docs:
> - [`implementation_plan.md`](file:///c:/Users/Peter.LAPTOP-GJB0UETS/workforce-optimizer/implementation_plan.md) — Architecture & phases
> - [`FEATURES.md`](file:///c:/Users/Peter.LAPTOP-GJB0UETS/workforce-optimizer/FEATURES.md) — Page-by-page feature spec
> - [`SETUP.md`](file:///c:/Users/Peter.LAPTOP-GJB0UETS/workforce-optimizer/SETUP.md) — Full code reference

---

## Current State

Your project is a **bare Laravel 13 scaffold** with:
- ✅ Laravel installed, app key generated
- ✅ Sanctum installed
- ✅ Tailwind CSS 4 + Vite configured
- ✅ `.env` configured for PostgreSQL (`workforce_optimizer` database)
- ❌ No custom migrations (only default `users`, `cache`, `jobs`, `personal_access_tokens`)
- ❌ No custom models (only default `User`)
- ❌ No custom controllers (only base `Controller`)
- ❌ No API routes defined
- ❌ No React app (just an empty `resources/js/app.js`)
- ❌ No optimizer services
- ❌ No seeders

---

## Phase 1 — Backend Foundation

### Step 1: Ensure PostgreSQL is Running & Database Exists

Open PowerShell and run:

```powershell
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"
```

If that works, create the database (skip if you already have it):

```powershell
psql -U postgres -c "CREATE DATABASE workforce_optimizer;"
```

---

### Step 2: Create All Migration Files

Run these from your project root (`c:\Users\Peter.LAPTOP-GJB0UETS\workforce-optimizer`):

```powershell
php artisan make:migration create_employees_table
php artisan make:migration create_skills_table
php artisan make:migration create_employee_skill_table
php artisan make:migration create_projects_table
php artisan make:migration create_project_skill_requirements_table
php artisan make:migration create_allocations_table
php artisan make:migration create_employee_preferences_table
```

This creates 7 files in `database/migrations/`.

---

### Step 3: Write the Migration Schemas

Open each newly created migration file and replace the `up()` method with the code below.

#### `database/migrations/xxxx_create_employees_table.php`

```php
public function up(): void
{
    Schema::create('employees', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('role');
        $table->string('department');
        $table->integer('max_weekly_hours')->default(40);
        $table->enum('remote_preference', ['remote', 'onsite', 'hybrid'])->default('hybrid');
        $table->date('availability_start')->nullable();
        $table->date('availability_end')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('employees');
}
```

#### `database/migrations/xxxx_create_skills_table.php`

```php
public function up(): void
{
    Schema::create('skills', function (Blueprint $table) {
        $table->id();
        $table->string('name')->unique();
        $table->string('category');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('skills');
}
```

#### `database/migrations/xxxx_create_employee_skill_table.php`

```php
public function up(): void
{
    Schema::create('employee_skill', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained()->onDelete('cascade');
        $table->foreignId('skill_id')->constrained()->onDelete('cascade');
        $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert']);
        $table->decimal('years_of_experience', 4, 1)->default(0);
        $table->timestamps();

        $table->unique(['employee_id', 'skill_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('employee_skill');
}
```

#### `database/migrations/xxxx_create_projects_table.php`

```php
public function up(): void
{
    Schema::create('projects', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->enum('status', ['planning', 'active', 'on_hold', 'completed'])->default('planning');
        $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
        $table->date('start_date')->nullable();
        $table->date('deadline')->nullable();
        $table->integer('estimated_hours')->default(0);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('projects');
}
```

#### `database/migrations/xxxx_create_project_skill_requirements_table.php`

```php
public function up(): void
{
    Schema::create('project_skill_requirements', function (Blueprint $table) {
        $table->id();
        $table->foreignId('project_id')->constrained()->onDelete('cascade');
        $table->foreignId('skill_id')->constrained()->onDelete('cascade');
        $table->enum('required_proficiency', ['beginner', 'intermediate', 'advanced', 'expert']);
        $table->integer('required_hours')->default(0);
        $table->timestamps();

        $table->unique(['project_id', 'skill_id']);
    });
}

public function down(): void
{
    Schema::dropIfExists('project_skill_requirements');
}
```

#### `database/migrations/xxxx_create_allocations_table.php`

```php
public function up(): void
{
    Schema::create('allocations', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained()->onDelete('cascade');
        $table->foreignId('project_id')->constrained()->onDelete('cascade');
        $table->integer('allocated_hours');
        $table->date('start_date');
        $table->date('end_date');
        $table->enum('status', ['proposed', 'confirmed', 'completed'])->default('proposed');
        $table->text('assignment_reason')->nullable();
        $table->decimal('allocation_score', 5, 2)->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('allocations');
}
```

#### `database/migrations/xxxx_create_employee_preferences_table.php`

```php
public function up(): void
{
    Schema::create('employee_preferences', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained()->onDelete('cascade')->unique();
        $table->json('preferred_technologies')->nullable();
        $table->string('preferred_project_type')->nullable();
        $table->integer('max_weekly_hours_override')->nullable();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('employee_preferences');
}
```

---

### Step 4: Run the Migrations

```powershell
php artisan migrate
```

Expected output — you should see all 7 new tables created (plus the 4 default ones).

Verify tables exist:

```powershell
php artisan db:show
```
-----DONE MIGRATION!!!!
---

### Step 5: Create Eloquent Models

```powershell
php artisan make:model Employee
php artisan make:model Skill
php artisan make:model Project
php artisan make:model Allocation
php artisan make:model EmployeePreference
php artisan make:model ProjectSkillRequirement
```

---

### Step 6: Write the Model Code

Replace the contents of each generated model file:

#### `app/Models/Employee.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'role', 'department',
        'max_weekly_hours', 'remote_preference',
        'availability_start', 'availability_end',
    ];

    protected $casts = [
        'availability_start' => 'date',
        'availability_end' => 'date',
    ];

    // ── Relationships ──────────────────────────────────

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'employee_skill')
                    ->withPivot('proficiency_level', 'years_of_experience')
                    ->withTimestamps();
    }

    public function allocations()
    {
        return $this->hasMany(Allocation::class);
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'allocations');
    }

    public function preferences()
    {
        return $this->hasOne(EmployeePreference::class);
    }

    // ── Computed Attributes ────────────────────────────

    public function getCurrentWorkloadAttribute(): int
    {
        return $this->allocations()
            ->whereIn('status', ['proposed', 'confirmed'])
            ->sum('allocated_hours');
    }

    public function getRemainingCapacityAttribute(): int
    {
        $maxHours = $this->preferences?->max_weekly_hours_override
                    ?? $this->max_weekly_hours;
        return max(0, $maxHours - $this->current_workload);
    }

    public function getUtilizationPercentageAttribute(): float
    {
        $maxHours = $this->preferences?->max_weekly_hours_override
                    ?? $this->max_weekly_hours;
        if ($maxHours === 0) return 0;
        return round(($this->current_workload / $maxHours) * 100, 1);
    }

    protected $appends = ['current_workload', 'remaining_capacity', 'utilization_percentage'];
}
```////

#### `app/Models/Skill.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'category'];

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_skill')
                    ->withPivot('proficiency_level', 'years_of_experience')
                    ->withTimestamps();
    }

    public function projectRequirements()
    {
        return $this->hasMany(ProjectSkillRequirement::class);
    }
}
```

#### `app/Models/Project.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'status', 'priority',
        'start_date', 'deadline', 'estimated_hours',
    ];

    protected $casts = [
        'start_date' => 'date',
        'deadline' => 'date',
    ];

    public function skillRequirements()
    {
        return $this->belongsToMany(Skill::class, 'project_skill_requirements')
                    ->withPivot('required_proficiency', 'required_hours')
                    ->withTimestamps();
    }

    public function allocations()
    {
        return $this->hasMany(Allocation::class);
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'allocations');
    }

    public function getStaffingCoverageAttribute(): float
    {
        if ($this->estimated_hours === 0) return 0;
        $allocated = $this->allocations()
            ->whereIn('status', ['proposed', 'confirmed'])
            ->sum('allocated_hours');
        return round(($allocated / $this->estimated_hours) * 100, 1);
    }

    protected $appends = ['staffing_coverage'];
}
```

#### `app/Models/Allocation.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'project_id', 'allocated_hours',
        'start_date', 'end_date', 'status',
        'assignment_reason', 'allocation_score',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'allocation_score' => 'float',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
```

#### `app/Models/EmployeePreference.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeePreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id', 'preferred_technologies',
        'preferred_project_type', 'max_weekly_hours_override',
    ];

    protected $casts = [
        'preferred_technologies' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
```

#### `app/Models/ProjectSkillRequirement.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectSkillRequirement extends Model
{
    protected $table = 'project_skill_requirements';

    protected $fillable = [
        'project_id', 'skill_id',
        'required_proficiency', 'required_hours',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function skill()
    {
        return $this->belongsTo(Skill::class);
    }
}
```

---

### Step 7: Generate API Controllers

```powershell
php artisan make:controller Api/EmployeeController --api
php artisan make:controller Api/SkillController --api
php artisan make:controller Api/ProjectController --api
php artisan make:controller Api/AllocationController --api
php artisan make:controller Api/DashboardController
php artisan make:controller Api/OptimizeController
php artisan make:controller Api/AnalyticsController
```

---

### Step 8: Write Controller Code

#### `app/Http/Controllers/Api/EmployeeController.php`

```php
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
            'name'               => 'required|string|max:255',
            'email'              => 'required|email|unique:employees',
            'role'               => 'required|string|max:255',
            'department'         => 'required|string|max:255',
            'max_weekly_hours'   => 'integer|min:1|max:168',
            'remote_preference'  => 'in:remote,onsite,hybrid',
            'availability_start' => 'nullable|date',
            'availability_end'   => 'nullable|date|after_or_equal:availability_start',
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
            'name'               => 'string|max:255',
            'email'              => 'email|unique:employees,email,' . $employee->id,
            'role'               => 'string|max:255',
            'department'         => 'string|max:255',
            'max_weekly_hours'   => 'integer|min:1|max:168',
            'remote_preference'  => 'in:remote,onsite,hybrid',
            'availability_start' => 'nullable|date',
            'availability_end'   => 'nullable|date|after_or_equal:availability_start',
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
            'skills'                       => 'required|array',
            'skills.*.skill_id'            => 'required|exists:skills,id',
            'skills.*.proficiency_level'   => 'required|in:beginner,intermediate,advanced,expert',
            'skills.*.years_of_experience' => 'numeric|min:0',
        ]);

        $syncData = [];
        foreach ($validated['skills'] as $skill) {
            $syncData[$skill['skill_id']] = [
                'proficiency_level'   => $skill['proficiency_level'],
                'years_of_experience' => $skill['years_of_experience'] ?? 0,
            ];
        }

        $employee->skills()->sync($syncData);
        return response()->json($employee->load('skills'));
    }
}
```

#### `app/Http/Controllers/Api/SkillController.php`

```php
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
            'name'     => 'required|string|max:255|unique:skills',
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
            'name'     => 'string|max:255|unique:skills,name,' . $skill->id,
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
```

#### `app/Http/Controllers/Api/ProjectController.php`

```php
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
            'name'            => 'required|string|max:255',
            'description'     => 'nullable|string',
            'status'          => 'in:planning,active,on_hold,completed',
            'priority'        => 'in:low,medium,high,critical',
            'start_date'      => 'nullable|date',
            'deadline'        => 'nullable|date|after_or_equal:start_date',
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
            'name'            => 'string|max:255',
            'description'     => 'nullable|string',
            'status'          => 'in:planning,active,on_hold,completed',
            'priority'        => 'in:low,medium,high,critical',
            'start_date'      => 'nullable|date',
            'deadline'        => 'nullable|date|after_or_equal:start_date',
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
            'requirements'                        => 'required|array',
            'requirements.*.skill_id'             => 'required|exists:skills,id',
            'requirements.*.required_proficiency' => 'required|in:beginner,intermediate,advanced,expert',
            'requirements.*.required_hours'       => 'integer|min:0',
        ]);

        $syncData = [];
        foreach ($validated['requirements'] as $req) {
            $syncData[$req['skill_id']] = [
                'required_proficiency' => $req['required_proficiency'],
                'required_hours'       => $req['required_hours'] ?? 0,
            ];
        }

        $project->skillRequirements()->sync($syncData);
        return response()->json($project->load('skillRequirements'));
    }
}
```

#### `app/Http/Controllers/Api/AllocationController.php`

```php
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'       => 'required|exists:employees,id',
            'project_id'        => 'required|exists:projects,id',
            'allocated_hours'   => 'required|integer|min:1',
            'start_date'        => 'required|date',
            'end_date'          => 'required|date|after_or_equal:start_date',
            'status'            => 'in:proposed,confirmed,completed',
            'assignment_reason' => 'nullable|string',
            'allocation_score'  => 'nullable|numeric|min:0|max:100',
        ]);

        $allocation = Allocation::create($validated);
        return response()->json($allocation->load(['employee', 'project']), 201);
    }

    public function show(Allocation $allocation)
    {
        return $allocation->load(['employee.skills', 'project.skillRequirements']);
    }

    public function update(Request $request, Allocation $allocation)
    {
        $validated = $request->validate([
            'allocated_hours'   => 'integer|min:1',
            'start_date'        => 'date',
            'end_date'          => 'date|after_or_equal:start_date',
            'status'            => 'in:proposed,confirmed,completed',
            'assignment_reason' => 'nullable|string',
            'allocation_score'  => 'nullable|numeric|min:0|max:100',
        ]);

        $allocation->update($validated);
        return response()->json($allocation->load(['employee', 'project']));
    }

    public function destroy(Allocation $allocation)
    {
        $allocation->delete();
        return response()->json(null, 204);
    }
}
```

#### `app/Http/Controllers/Api/DashboardController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Allocation;
use App\Models\Skill;

class DashboardController extends Controller
{
    public function overview()
    {
        $employees = Employee::with(['skills', 'allocations', 'preferences'])->get();
        $projects = Project::with(['skillRequirements', 'allocations'])->get();

        $totalEmployees = $employees->count();
        $activeProjects = $projects->where('status', 'active')->count();

        $avgUtilization = $totalEmployees > 0
            ? round($employees->avg('utilization_percentage'), 1)
            : 0;

        $overallocated = $employees->filter(fn($e) => $e->utilization_percentage > 100)->count();
        $underutilized = $employees->filter(fn($e) => $e->utilization_percentage < 30)->count();

        return response()->json([
            'total_employees'  => $totalEmployees,
            'active_projects'  => $activeProjects,
            'avg_utilization'  => $avgUtilization,
            'overallocated'    => $overallocated,
            'underutilized'    => $underutilized,
            'employees'        => $employees,
            'projects'         => $projects,
        ]);
    }
}
```

#### `app/Http/Controllers/Api/AnalyticsController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Project;
use App\Models\Skill;

class AnalyticsController extends Controller
{
    public function utilization()
    {
        $employees = Employee::with(['allocations', 'preferences'])->get();

        return $employees->map(fn($e) => [
            'id'                    => $e->id,
            'name'                  => $e->name,
            'department'            => $e->department,
            'max_weekly_hours'      => $e->max_weekly_hours,
            'current_workload'      => $e->current_workload,
            'remaining_capacity'    => $e->remaining_capacity,
            'utilization_percentage' => $e->utilization_percentage,
        ]);
    }

    public function skillGaps()
    {
        $skills = Skill::withCount(['employees', 'projectRequirements'])->get();

        return $skills->map(fn($s) => [
            'id'       => $s->id,
            'name'     => $s->name,
            'category' => $s->category,
            'supply'   => $s->employees_count,
            'demand'   => $s->project_requirements_count,
            'gap'      => $s->employees_count - $s->project_requirements_count,
        ]);
    }

    public function overallocated()
    {
        $employees = Employee::with(['allocations', 'preferences'])->get();

        return $employees
            ->filter(fn($e) => $e->utilization_percentage > 100)
            ->values()
            ->map(fn($e) => [
                'id'                    => $e->id,
                'name'                  => $e->name,
                'utilization_percentage' => $e->utilization_percentage,
                'current_workload'      => $e->current_workload,
                'max_weekly_hours'      => $e->max_weekly_hours,
            ]);
    }

    public function underutilized()
    {
        $employees = Employee::with(['allocations', 'preferences'])->get();

        return $employees
            ->filter(fn($e) => $e->utilization_percentage < 30)
            ->values()
            ->map(fn($e) => [
                'id'                    => $e->id,
                'name'                  => $e->name,
                'utilization_percentage' => $e->utilization_percentage,
                'remaining_capacity'    => $e->remaining_capacity,
            ]);
    }

    public function projectCoverage()
    {
        $projects = Project::with(['skillRequirements', 'allocations'])->get();

        return $projects->map(fn($p) => [
            'id'                => $p->id,
            'name'              => $p->name,
            'priority'          => $p->priority,
            'status'            => $p->status,
            'estimated_hours'   => $p->estimated_hours,
            'staffing_coverage' => $p->staffing_coverage,
        ]);
    }
}
```

#### `app/Http/Controllers/Api/OptimizeController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Optimizer\OptimizerService;
use Illuminate\Http\Request;

class OptimizeController extends Controller
{
    public function __construct(
        private OptimizerService $optimizerService
    ) {}

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
            'proposals'                    => 'required|array',
            'proposals.*.employee_id'      => 'required|exists:employees,id',
            'proposals.*.project_id'       => 'required|exists:projects,id',
            'proposals.*.allocated_hours'  => 'required|integer|min:1',
            'proposals.*.assignment_reason' => 'nullable|string',
            'proposals.*.allocation_score' => 'nullable|numeric',
        ]);

        $count = $this->optimizerService->acceptProposals($validated['proposals']);

        return response()->json([
            'message' => "{$count} allocations created successfully",
            'count'   => $count,
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
```

---

### Step 9: Define API Routes

Replace the entire contents of `routes/api.php`:

```php
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
```

---

### Step 10: Create the Optimizer Services

Create the services directory and files:

```powershell
mkdir app\Services\Optimizer -Force
```

#### `app/Services/Optimizer/ScoringService.php`

```php
<?php

namespace App\Services\Optimizer;

use App\Models\Employee;
use App\Models\Project;
use Illuminate\Support\Collection;

class ScoringService
{
    private const WEIGHTS = [
        'skill_match'      => 0.50,
        'availability'     => 0.20,
        'workload_balance' => 0.15,
        'experience'       => 0.10,
        'preference'       => 0.05,
    ];

    public function compositeScore(
        Employee $employee,
        Project $project,
        Collection $allEmployees
    ): array {
        $scores = [
            'skill_match'      => $this->calculateSkillMatch($employee, $project),
            'availability'     => $this->calculateAvailability($employee),
            'workload_balance' => $this->calculateWorkloadBalance($employee, $allEmployees),
            'experience'       => $this->calculateExperienceScore($employee, $project),
            'preference'       => $this->calculatePreferenceScore($employee, $project),
        ];

        $total = 0;
        $reasons = [];

        foreach ($scores as $key => $result) {
            $total += $result['score'] * self::WEIGHTS[$key];
            $reasons[] = $result['reason'];
        }

        return [
            'score'   => round($total, 2),
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
            'beginner'     => 1,
            'intermediate' => 2,
            'advanced'     => 3,
            'expert'       => 4,
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
            'score'  => round($score, 2),
            'reason' => "{$remaining} hours available out of {$max} hr capacity",
        ];
    }

    public function calculateWorkloadBalance(Employee $employee, Collection $allEmployees): array
    {
        $utilization = $employee->utilization_percentage;
        $score = max(0, 100 - $utilization);

        $suffix = '';
        if ($utilization < 50) $suffix = ' — room for more work';
        elseif ($utilization > 80) $suffix = ' — nearing capacity';

        return [
            'score'  => round($score, 2),
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
            'score'  => round($score, 2),
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
            'score'  => round($score, 2),
            'reason' => "{$overlap} of {$total} required skills match employee preferences",
        ];
    }
}
```

#### `app/Services/Optimizer/AllocatorService.php`

```php
<?php

namespace App\Services\Optimizer;

use App\Models\Employee;
use App\Models\Project;
use Illuminate\Support\Collection;

class AllocatorService
{
    public function __construct(
        private ScoringService $scoringService
    ) {}

    public function allocate(Collection $projects, Collection $employees): array
    {
        $priorityOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];

        $sortedProjects = $projects->sortBy(
            fn(Project $p) => $priorityOrder[$p->priority] ?? 99
        );

        $capacityTracker = [];
        foreach ($employees as $emp) {
            $capacityTracker[$emp->id] = $emp->remaining_capacity;
        }

        $proposedAllocations = [];

        foreach ($sortedProjects as $project) {
            $candidates = [];

            foreach ($employees as $employee) {
                if ($capacityTracker[$employee->id] <= 0) {
                    continue;
                }

                $result = $this->scoringService->compositeScore($employee, $project, $employees);
                $candidates[] = [
                    'employee' => $employee,
                    'score'    => $result['score'],
                    'reasons'  => $result['reasons'],
                    'details'  => $result['details'],
                ];
            }

            usort($candidates, fn($a, $b) => $b['score'] <=> $a['score']);

            $remainingProjectHours = $project->estimated_hours;

            foreach ($candidates as $candidate) {
                if ($remainingProjectHours <= 0) break;

                $empId = $candidate['employee']->id;
                $availableHours = $capacityTracker[$empId];
                $allocateHours = min($availableHours, $remainingProjectHours);

                if ($allocateHours <= 0) continue;

                $proposedAllocations[] = [
                    'employee_id'       => $empId,
                    'employee_name'     => $candidate['employee']->name,
                    'project_id'        => $project->id,
                    'project_name'      => $project->name,
                    'allocated_hours'   => $allocateHours,
                    'allocation_score'  => $candidate['score'],
                    'assignment_reason' => implode(' | ', $candidate['reasons']),
                    'score_details'     => $candidate['details'],
                    'status'            => 'proposed',
                ];

                $capacityTracker[$empId] -= $allocateHours;
                $remainingProjectHours -= $allocateHours;
            }
        }

        return $proposedAllocations;
    }
}
```

#### `app/Services/Optimizer/OptimizerService.php`

```php
<?php

namespace App\Services\Optimizer;

use App\Models\Allocation;
use App\Models\Employee;
use App\Models\Project;

class OptimizerService
{
    public function __construct(
        private AllocatorService $allocatorService
    ) {}

    public function run(array $projectIds = []): array
    {
        $projectQuery = Project::with('skillRequirements')
            ->whereIn('status', ['planning', 'active']);

        if (!empty($projectIds)) {
            $projectQuery->whereIn('id', $projectIds);
        }

        $projects = $projectQuery->get();
        $employees = Employee::with(['skills', 'allocations', 'preferences'])->get();

        $proposals = $this->allocatorService->allocate($projects, $employees);

        return [
            'proposals'  => $proposals,
            'summary'    => $this->buildSummary($proposals, $projects, $employees),
            'created_at' => now()->toIso8601String(),
        ];
    }

    public function acceptProposals(array $proposals): int
    {
        $count = 0;

        foreach ($proposals as $proposal) {
            Allocation::create([
                'employee_id'       => $proposal['employee_id'],
                'project_id'        => $proposal['project_id'],
                'allocated_hours'   => $proposal['allocated_hours'],
                'start_date'        => now(),
                'end_date'          => now()->addWeeks(4),
                'status'            => 'confirmed',
                'assignment_reason' => $proposal['assignment_reason'] ?? null,
                'allocation_score'  => $proposal['allocation_score'] ?? null,
            ]);
            $count++;
        }

        return $count;
    }

    private function buildSummary(array $proposals, $projects, $employees): array
    {
        $totalProposals = count($proposals);
        $avgScore = $totalProposals > 0
            ? round(collect($proposals)->avg('allocation_score'), 2)
            : 0;

        $projectsCovered = collect($proposals)->pluck('project_id')->unique()->count();
        $employeesAssigned = collect($proposals)->pluck('employee_id')->unique()->count();

        return [
            'total_proposals'    => $totalProposals,
            'average_score'      => $avgScore,
            'projects_covered'   => $projectsCovered . ' / ' . $projects->count(),
            'employees_assigned' => $employeesAssigned . ' / ' . $employees->count(),
        ];
    }
}
```

---

### Step 11: Seed the Database with Demo Data

Create the seeder:

```powershell
php artisan make:seeder DemoDataSeeder
```

Replace the contents of `database/seeders/DemoDataSeeder.php`:

```php
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
            ['name' => 'PHP',          'category' => 'Backend'],
            ['name' => 'Laravel',      'category' => 'Backend'],
            ['name' => 'JavaScript',   'category' => 'Frontend'],
            ['name' => 'React',        'category' => 'Frontend'],
            ['name' => 'TypeScript',   'category' => 'Frontend'],
            ['name' => 'Vue.js',       'category' => 'Frontend'],
            ['name' => 'Python',       'category' => 'Backend'],
            ['name' => 'PostgreSQL',   'category' => 'Database'],
            ['name' => 'MySQL',        'category' => 'Database'],
            ['name' => 'Docker',       'category' => 'DevOps'],
            ['name' => 'AWS',          'category' => 'DevOps'],
            ['name' => 'Figma',        'category' => 'Design'],
            ['name' => 'Tailwind CSS', 'category' => 'Frontend'],
            ['name' => 'Node.js',      'category' => 'Backend'],
            ['name' => 'Redis',        'category' => 'Database'],
        ];

        foreach ($skills as $skill) {
            Skill::create($skill);
        }

        $allSkills = Skill::all();
        $proficiencies = ['beginner', 'intermediate', 'advanced', 'expert'];

        // ── Employees ───────────────────────────────────
        $employeeData = [
            ['name' => 'Alice Chen',    'role' => 'Senior Developer', 'department' => 'Engineering'],
            ['name' => 'Bob Martinez',  'role' => 'Full Stack Dev',   'department' => 'Engineering'],
            ['name' => 'Carol Nguyen',  'role' => 'Frontend Dev',     'department' => 'Engineering'],
            ['name' => 'David Kim',     'role' => 'Backend Dev',      'department' => 'Engineering'],
            ['name' => 'Eva Patel',     'role' => 'DevOps Engineer',  'department' => 'Infrastructure'],
            ['name' => 'Frank Lopez',   'role' => 'UI/UX Designer',   'department' => 'Design'],
            ['name' => 'Grace Wang',    'role' => 'Junior Developer', 'department' => 'Engineering'],
            ['name' => 'Henry Brooks',  'role' => 'Tech Lead',        'department' => 'Engineering'],
            ['name' => 'Iris Taylor',   'role' => 'QA Engineer',      'department' => 'Quality'],
            ['name' => 'Jack Wilson',   'role' => 'Data Engineer',    'department' => 'Data'],
        ];

        foreach ($employeeData as $data) {
            $employee = Employee::create([
                'name'               => $data['name'],
                'email'              => strtolower(str_replace(' ', '.', $data['name'])) . '@company.com',
                'role'               => $data['role'],
                'department'         => $data['department'],
                'max_weekly_hours'   => rand(30, 40),
                'remote_preference'  => ['remote', 'onsite', 'hybrid'][array_rand(['remote', 'onsite', 'hybrid'])],
                'availability_start' => now()->subMonths(rand(1, 6)),
                'availability_end'   => now()->addMonths(rand(3, 12)),
            ]);

            // Attach 3–6 random skills
            $randomSkills = $allSkills->random(rand(3, 6));
            foreach ($randomSkills as $skill) {
                $employee->skills()->attach($skill->id, [
                    'proficiency_level'   => $proficiencies[array_rand($proficiencies)],
                    'years_of_experience' => rand(1, 10) + (rand(0, 1) * 0.5),
                ]);
            }

            // Add preferences
            EmployeePreference::create([
                'employee_id'            => $employee->id,
                'preferred_technologies' => $randomSkills->random(min(2, $randomSkills->count()))->pluck('name')->toArray(),
                'preferred_project_type' => ['web', 'mobile', 'data', 'infrastructure'][array_rand(['web', 'mobile', 'data', 'infrastructure'])],
            ]);
        }

        // ── Projects ────────────────────────────────────
        $projectData = [
            ['name' => 'E-Commerce Platform Redesign', 'priority' => 'critical', 'hours' => 200],
            ['name' => 'Mobile App API v2',            'priority' => 'high',     'hours' => 150],
            ['name' => 'Internal Dashboard',           'priority' => 'medium',   'hours' => 100],
            ['name' => 'Data Pipeline Migration',      'priority' => 'high',     'hours' => 120],
            ['name' => 'Landing Page Refresh',         'priority' => 'low',      'hours' => 40],
        ];

        foreach ($projectData as $data) {
            $project = Project::create([
                'name'            => $data['name'],
                'description'     => "Project: {$data['name']}",
                'status'          => 'active',
                'priority'        => $data['priority'],
                'start_date'      => now(),
                'deadline'        => now()->addMonths(rand(2, 6)),
                'estimated_hours' => $data['hours'],
            ]);

            // Attach 2–4 random skill requirements
            $reqSkills = $allSkills->random(rand(2, 4));
            foreach ($reqSkills as $skill) {
                $project->skillRequirements()->attach($skill->id, [
                    'required_proficiency' => $proficiencies[array_rand($proficiencies)],
                    'required_hours'       => rand(10, 50),
                ]);
            }
        }
    }
}
```

Update `database/seeders/DatabaseSeeder.php` — add the `DemoDataSeeder` call:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DemoDataSeeder::class);
    }
}
```

Now run everything:

```powershell
php artisan migrate:fresh --seed
```doneeee

---

### Step 12: Verify the Backend Works

```powershell
# Start the Laravel server
php artisan serve
```

Open a **second terminal** and test the API:

```powershell
# List employees
curl http://localhost:8000/api/employees

# List projects
curl http://localhost:8000/api/projects

# List skills
curl http://localhost:8000/api/skills

# Dashboard overview
curl http://localhost:8000/api/dashboard/overview

# Run optimizer
curl -X POST http://localhost:8000/api/optimize -H "Content-Type: application/json" -d "{}"

# Check routes
php artisan route:list --path=api
```

All endpoints should return JSON data. If they do, your **entire backend is complete for Phases 1–2**.

---DONEE!!!

## Phase 2 — React Frontend Setup

### Step 13: Install React and Dependencies

From the project root:

```powershell
# Install React and related packages
npm install react react-dom react-router-dom axios recharts lucide-react
npm install -D @vitejs/plugin-react
```DONEEE!!!

---

### Step 14: Update Vite Config for React

Replace the contents of `vite.config.js`:

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
```

---

### Step 15: Create the Frontend Directory Structure

```powershell
mkdir resources\js\pages -Force
mkdir resources\js\components -Force
mkdir resources\js\api -Force
mkdir resources\js\layouts -Force
```

---

### Step 16: Create the API Client

Create `resources/js/api/client.js`:

```js
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;
```

---

### Step 17: Create the App Shell with Sidebar Layout

Rename `resources/js/app.js` → `resources/js/app.jsx` and replace its contents:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import ProjectsPage from './pages/ProjectsPage';
import AllocationsPage from './pages/AllocationsPage';
import OptimizePage from './pages/OptimizePage';

function App() {
    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/allocations" element={<AllocationsPage />} />
                    <Route path="/optimize" element={<OptimizePage />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}

const container = document.getElementById('app');
if (container) {
    createRoot(container).render(<App />);
}
```

---

### Step 18: Create the App Layout (Sidebar + Top Bar)

Create `resources/js/layouts/AppLayout.jsx`:

```jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Users, FolderKanban, Link2,
    Rocket, Settings, Menu, X, ChevronLeft
} from 'lucide-react';

const navItems = [
    { path: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
    { path: '/employees',   label: 'Employees',   icon: Users },
    { path: '/projects',    label: 'Projects',     icon: FolderKanban },
    { path: '/allocations', label: 'Allocations',  icon: Link2 },
    { path: '/optimize',    label: 'Optimizer',    icon: Rocket },
];

export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gray-950 text-white flex">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 z-40 flex flex-col ${
                    sidebarOpen ? 'w-64' : 'w-16'
                }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                    {sidebarOpen && (
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent whitespace-nowrap">
                            Workforce Optimizer
                        </h1>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-4 px-2 space-y-1">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`
                            }
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {sidebarOpen && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                {/* Top Bar */}
                <header className="h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                            U
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
```

---

### Step 19: Create the Dashboard Page

Create `resources/js/pages/DashboardPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Users, FolderKanban, Activity, AlertTriangle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';

function OverviewCard({ icon: Icon, title, value, subtitle, color }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={18} />
                </div>
                <span className="text-sm text-gray-400">{title}</span>
            </div>
            <div className="text-3xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}

function getUtilColor(pct) {
    if (pct > 100) return '#ef4444';
    if (pct > 90)  return '#f59e0b';
    if (pct > 70)  return '#eab308';
    return '#22c55e';
}

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/overview')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="text-gray-400">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="text-red-400">Failed to load dashboard data.</div>;
    }

    const utilizationData = (data.employees || []).map(e => ({
        name: e.name.split(' ')[0],
        utilization: e.utilization_percentage,
    }));

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <OverviewCard
                    icon={Users}
                    title="Total Employees"
                    value={data.total_employees}
                    color="bg-blue-600/20 text-blue-400"
                />
                <OverviewCard
                    icon={FolderKanban}
                    title="Active Projects"
                    value={data.active_projects}
                    color="bg-purple-600/20 text-purple-400"
                />
                <OverviewCard
                    icon={Activity}
                    title="Avg Utilization"
                    value={`${data.avg_utilization}%`}
                    color="bg-green-600/20 text-green-400"
                />
                <OverviewCard
                    icon={AlertTriangle}
                    title="Overallocated"
                    value={data.overallocated}
                    subtitle={`${data.underutilized} underutilized`}
                    color="bg-red-600/20 text-red-400"
                />
            </div>

            {/* Utilization Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4">Employee Utilization</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utilizationData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" domain={[0, 120]} stroke="#9ca3af" />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" width={80} />
                        <Tooltip
                            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                            {utilizationData.map((entry, index) => (
                                <Cell key={index} fill={getUtilColor(entry.utilization)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Project Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6">
                <h3 className="text-lg font-semibold mb-4">Project Status</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-800">
                            <th className="text-left py-3 px-2">Project</th>
                            <th className="text-left py-3 px-2">Priority</th>
                            <th className="text-left py-3 px-2">Status</th>
                            <th className="text-left py-3 px-2">Staffing</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.projects || []).map(p => (
                            <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                <td className="py-3 px-2 font-medium">{p.name}</td>
                                <td className="py-3 px-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        p.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                        p.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                        p.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                        {p.priority}
                                    </span>
                                </td>
                                <td className="py-3 px-2">
                                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                                        {p.status}
                                    </span>
                                </td>
                                <td className="py-3 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-blue-500"
                                                style={{ width: `${Math.min(100, p.staffing_coverage)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400">{p.staffing_coverage}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```DONEEEEEEEEEEE

---

### Step 20: Create the Employees Page

Create `resources/js/pages/EmployeesPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

function SkillBadge({ name, level }) {
    const colors = {
        beginner:     'bg-gray-600/30 text-gray-300',
        intermediate: 'bg-blue-600/30 text-blue-300',
        advanced:     'bg-purple-600/30 text-purple-300',
        expert:       'bg-amber-600/30 text-amber-300',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[level] || colors.beginner}`}>
            {name}
        </span>
    );
}

function UtilizationBar({ percentage }) {
    const color =
        percentage > 100 ? 'bg-red-500' :
        percentage > 90  ? 'bg-yellow-500' :
        percentage > 70  ? 'bg-yellow-400' : 'bg-green-500';
    return (
        <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(120, percentage)}%` }} />
            </div>
            <span className="text-xs text-gray-400">{percentage}%</span>
        </div>
    );
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [form, setForm] = useState({
        name: '', email: '', role: '', department: '',
        max_weekly_hours: 40, remote_preference: 'hybrid',
    });

    const fetchEmployees = () => {
        api.get('/employees')
            .then(res => setEmployees(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchEmployees(); }, []);

    const openCreate = () => {
        setEditingEmployee(null);
        setForm({ name: '', email: '', role: '', department: '', max_weekly_hours: 40, remote_preference: 'hybrid' });
        setShowModal(true);
    };

    const openEdit = (emp) => {
        setEditingEmployee(emp);
        setForm({
            name: emp.name, email: emp.email, role: emp.role,
            department: emp.department, max_weekly_hours: emp.max_weekly_hours,
            remote_preference: emp.remote_preference,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                await api.put(`/employees/${editingEmployee.id}`, form);
            } else {
                await api.post('/employees', form);
            }
            setShowModal(false);
            fetchEmployees();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving employee');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-gray-400">Loading employees...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Employees</h2>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={16} /> Add Employee
                </button>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-800 bg-gray-900/50">
                            <th className="text-left py-3 px-4">Name</th>
                            <th className="text-left py-3 px-4">Department</th>
                            <th className="text-left py-3 px-4">Role</th>
                            <th className="text-left py-3 px-4">Skills</th>
                            <th className="text-left py-3 px-4">Utilization</th>
                            <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{emp.name}</div>
                                            <div className="text-xs text-gray-500">{emp.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-gray-400">{emp.department}</td>
                                <td className="py-3 px-4 text-gray-400">{emp.role}</td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(emp.skills || []).slice(0, 3).map(s => (
                                            <SkillBadge key={s.id} name={s.name} level={s.pivot?.proficiency_level} />
                                        ))}
                                        {(emp.skills || []).length > 3 && (
                                            <span className="text-xs text-gray-500">+{emp.skills.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <UtilizationBar percentage={emp.utilization_percentage} />
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            {['name', 'email', 'role', 'department'].map(field => (
                                <div key={field}>
                                    <label className="block text-sm text-gray-400 mb-1 capitalize">{field}</label>
                                    <input
                                        type={field === 'email' ? 'email' : 'text'}
                                        value={form[field]}
                                        onChange={e => setForm({ ...form, [field]: e.target.value })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Max Weekly Hours</label>
                                <input
                                    type="number"
                                    value={form.max_weekly_hours}
                                    onChange={e => setForm({ ...form, max_weekly_hours: parseInt(e.target.value) })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    min="1" max="168"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Work Preference</label>
                                <select
                                    value={form.remote_preference}
                                    onChange={e => setForm({ ...form, remote_preference: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="remote">Remote</option>
                                    <option value="onsite">Onsite</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                                {editingEmployee ? 'Update Employee' : 'Create Employee'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
```DONEEEEEEEEE

---

### Step 21: Create the Projects Page

Create `resources/js/pages/ProjectsPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, Clock, Users, X } from 'lucide-react';

const priorityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
    low:      'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', status: 'planning',
        priority: 'medium', estimated_hours: 0,
        start_date: '', deadline: '',
    });

    const fetchProjects = () => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', form);
            setShowModal(false);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving project');
        }
    };

    if (loading) return <div className="text-gray-400">Loading projects...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Projects</h2>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={16} /> Add Project
                </button>
            </div>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(p => {
                    const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                        <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-base">{p.name}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[p.priority]}`}>
                                    {p.priority}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{p.description}</p>

                            {/* Deadline */}
                            {daysLeft !== null && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                    <Clock size={12} />
                                    {daysLeft > 0 ? `${daysLeft} days remaining` : (
                                        <span className="text-red-400">⚠️ {Math.abs(daysLeft)} days overdue</span>
                                    )}
                                </div>
                            )}

                            {/* Staffing Progress */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Staffing</span>
                                    <span>{p.staffing_coverage}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            p.staffing_coverage >= 100 ? 'bg-green-500' :
                                            p.staffing_coverage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(100, p.staffing_coverage)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Skill Tags */}
                            <div className="flex flex-wrap gap-1">
                                {(p.skill_requirements || []).map(s => (
                                    <span key={s.id} className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400">
                                        {s.name}
                                    </span>
                                ))}
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock size={11} /> {p.estimated_hours}h</span>
                                <span className="flex items-center gap-1"><Users size={11} /> {(p.allocations || []).length} assigned</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Project Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold">Add Project</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" rows="3" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Priority</label>
                                    <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                        <option value="planning">Planning</option>
                                        <option value="active">Active</option>
                                        <option value="on_hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Estimated Hours</label>
                                <input type="number" value={form.estimated_hours} onChange={e => setForm({...form, estimated_hours: parseInt(e.target.value) || 0})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" min="0" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Deadline</label>
                                    <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                                Create Project
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
```

---

### Step 22: Create the Allocations Page

Create `resources/js/pages/AllocationsPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, X } from 'lucide-react';

const statusColors = {
    proposed:  'border-blue-500/30 bg-blue-500/10 text-blue-400',
    confirmed: 'border-green-500/30 bg-green-500/10 text-green-400',
    completed: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
};

export default function AllocationsPage() {
    const [allocations, setAllocations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        employee_id: '', project_id: '', allocated_hours: 10,
        start_date: '', end_date: '', status: 'proposed',
    });

    const fetchData = async () => {
        try {
            const [allRes, empRes, projRes] = await Promise.all([
                api.get('/allocations'),
                api.get('/employees'),
                api.get('/projects'),
            ]);
            setAllocations(allRes.data);
            setEmployees(empRes.data);
            setProjects(projRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.post('/allocations', form);
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating allocation');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/allocations/${id}`, { status: newStatus });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this allocation?')) return;
        try {
            await api.delete(`/allocations/${id}`);
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="text-gray-400">Loading allocations...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Allocations</h2>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={16} /> Manual Assign
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-800 bg-gray-900/50">
                            <th className="text-left py-3 px-4">Employee</th>
                            <th className="text-left py-3 px-4">Project</th>
                            <th className="text-left py-3 px-4">Hours</th>
                            <th className="text-left py-3 px-4">Dates</th>
                            <th className="text-left py-3 px-4">Status</th>
                            <th className="text-left py-3 px-4">Score</th>
                            <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allocations.map(a => (
                            <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                                <td className="py-3 px-4 font-medium">{a.employee?.name}</td>
                                <td className="py-3 px-4 text-gray-400">{a.project?.name}</td>
                                <td className="py-3 px-4">{a.allocated_hours}h</td>
                                <td className="py-3 px-4 text-xs text-gray-500">
                                    {a.start_date?.slice(0,10)} → {a.end_date?.slice(0,10)}
                                </td>
                                <td className="py-3 px-4">
                                    <select
                                        value={a.status}
                                        onChange={e => handleStatusChange(a.id, e.target.value)}
                                        className={`px-2 py-1 rounded-full text-xs font-medium border bg-transparent cursor-pointer ${statusColors[a.status]}`}
                                    >
                                        <option value="proposed">Proposed</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </td>
                                <td className="py-3 px-4 text-gray-400">{a.allocation_score ?? '—'}</td>
                                <td className="py-3 px-4">
                                    <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-400 text-xs">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {allocations.length === 0 && (
                            <tr><td colSpan="7" className="py-8 text-center text-gray-500">No allocations yet. Use the Optimizer or manually assign employees.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Manual Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold">Manual Assignment</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Employee</label>
                                <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required>
                                    <option value="">Select employee...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.remaining_capacity}h available)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Project</label>
                                <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required>
                                    <option value="">Select project...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.staffing_coverage}% staffed)</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Hours</label>
                                <input type="number" value={form.allocated_hours} onChange={e => setForm({...form, allocated_hours: parseInt(e.target.value) || 0})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" min="1" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                                    <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">End Date</label>
                                    <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" required />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                                Create Allocation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
```

---

### Step 23: Create the Optimize Page

Create `resources/js/pages/OptimizePage.jsx`:

```jsx
import React, { useState } from 'react';
import api from '../api/client';
import { Rocket, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function OptimizePage() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});

    const runOptimization = async () => {
        setLoading(true);
        try {
            const res = await api.post('/optimize', {});
            setResults(res.data);
        } catch (err) {
            alert('Optimization failed: ' + (err.response?.data?.message || err.message));
        }
        setLoading(false);
    };

    const acceptAll = async () => {
        if (!results?.proposals?.length) return;
        if (!confirm(`Accept all ${results.proposals.length} proposed allocations?`)) return;
        try {
            await api.post('/optimize/accept', { proposals: results.proposals });
            alert('All allocations created successfully!');
            setResults(null);
        } catch (err) {
            alert('Error accepting proposals: ' + (err.response?.data?.message || err.message));
        }
    };

    const toggleExpand = (idx) => {
        setExpanded(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Optimizer</h2>

            {/* Run Button */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 text-center">
                <p className="text-gray-400 mb-4">
                    Run the optimization engine to generate allocation proposals based on skill matching, availability, and workload balance.
                </p>
                <button
                    onClick={runOptimization}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                    <Rocket size={18} />
                    {loading ? 'Optimizing...' : '🚀 Optimize Allocation'}
                </button>
            </div>

            {/* Results */}
            {results && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {Object.entries(results.summary || {}).map(([key, value]) => (
                            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                <div className="text-xs text-gray-400 mb-1">{key.replace(/_/g, ' ').toUpperCase()}</div>
                                <div className="text-xl font-bold">{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Proposals List */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
                        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="font-semibold">Proposed Allocations ({results.proposals?.length || 0})</h3>
                            <button onClick={acceptAll} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <Check size={14} /> Accept All
                            </button>
                        </div>
                        <div className="divide-y divide-gray-800">
                            {(results.proposals || []).map((p, idx) => (
                                <div key={idx} className="px-5 py-3">
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(idx)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                                                {(p.employee_name || '?')[0]}
                                            </div>
                                            <div>
                                                <span className="font-medium">{p.employee_name}</span>
                                                <span className="text-gray-500 mx-2">→</span>
                                                <span className="text-gray-300">{p.project_name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-400">{p.allocated_hours}h</span>
                                            <span className="text-sm font-medium text-blue-400">Score: {p.allocation_score}</span>
                                            {expanded[idx] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                        </div>
                                    </div>
                                    {expanded[idx] && (
                                        <div className="mt-3 ml-12 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400 space-y-1">
                                            {(p.assignment_reason || '').split(' | ').map((reason, i) => (
                                                <div key={i}>• {reason}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
```

---

### Step 24: Update the Blade Template to Serve React

Replace the contents of `resources/views/welcome.blade.php`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workforce Optimizer</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

---

### Step 25: Update the Web Route to Serve the SPA

Replace the contents of `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    return view('welcome');
})->where('any', '.*');
```

---

### Step 26: Install npm Dependencies & Run

```powershell
# Install all dependencies
npm install

# Start the dev server (this runs both Vite + Laravel)
composer run dev
```

If `composer run dev` doesn't work (depends on your Laravel version), run two terminals:

**Terminal 1:**
```powershell
php artisan serve
```

**Terminal 2:**
```powershell
npm run dev
```

Open **http://localhost:8000** in your browser.

---

## Verification Checklist

Once everything is running, confirm each of these works:

| # | What to Test | How |
|---|---|---|
| 1 | Dashboard loads with data | Navigate to `/dashboard` — see 4 metric cards + chart |
| 2 | Employees table shows 10 seeded employees | Navigate to `/employees` |
| 3 | Add Employee modal works | Click "Add Employee" → fill form → submit |
| 4 | Edit/Delete employee works | Click pencil/trash icons on any row |
| 5 | Projects page shows 5 cards | Navigate to `/projects` |
| 6 | Add Project modal works | Click "Add Project" → fill form → submit |
| 7 | Allocations page shows empty | Navigate to `/allocations` (no allocations yet) |
| 8 | Optimizer runs and shows proposals | Navigate to `/optimize` → click "🚀 Optimize" |
| 9 | Accept All creates allocations | Click "Accept All" on optimizer results |
| 10 | Allocations now show data | Navigate to `/allocations` — populated |
| 11 | Dashboard updates | Navigate to `/dashboard` — utilization should be non-zero |

---

## What's Left After These Steps (Future Phases)

| Feature | Phase | Status |
|---|---|---|
| Employee Detail page (`/employees/:id`) | 1 | Not built yet |
| Project Detail page (`/projects/:id`) | 1 | Not built yet |
| Skill management page | 1 | Not built yet |
| Skill Coverage Matrix component | 3 | Not built yet |
| Workforce Heatmap component | 3 | Not built yet |
| Skill Gap Analysis chart | 3 | Not built yet |
| Kanban board view for allocations | 3 | Not built yet |
| Gantt/Timeline view for allocations | 3 | Not built yet |
| What-if Simulations page | 4 | Placeholder API only |
| ILP optimizer upgrade | 4 | Not started |
| Settings page | 4 | Not started |
| Authentication (login/register) | 4 | Not started |
| Production deployment | 4 | Docker config in SETUP.md |

> Refer to [`FEATURES.md`](file:///c:/Users/Peter.LAPTOP-GJB0UETS/workforce-optimizer/FEATURES.md) for the full spec of each remaining page and component.
