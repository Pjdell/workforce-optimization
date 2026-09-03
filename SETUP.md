# Workforce Allocation Optimizer — Complete Setup Guide

A step-by-step guide to set up the entire project from scratch on a **Windows** machine. Follow every step in order.

---

## Table of Contents

1. [Prerequisites](#1--prerequisites)
2. [Install Required Software](#2--install-required-software)
3. [Create the Project Directory](#3--create-the-project-directory)
4. [Set Up the Laravel Backend](#4--set-up-the-laravel-backend)
5. [Configure the Environment File](#5--configure-the-environment-file)
6. [Set Up PostgreSQL Database](#6--set-up-postgresql-database)
7. [Run Database Migrations](#7--run-database-migrations)
8. [Create Eloquent Models](#8--create-eloquent-models)
9. [Build API Controllers & Routes](#9--build-api-controllers--routes)
10. [Create the Optimizer Services](#10--create-the-optimizer-services)
11. [Set Up the React Frontend](#11--set-up-the-react-frontend)
12. [Connect Frontend to Backend (CORS)](#12--connect-frontend-to-backend-cors)
13. [Seed the Database with Demo Data](#13--seed-the-database-with-demo-data)
14. [Run the Development Servers](#14--run-the-development-servers)
15. [Run Tests](#15--run-tests)
16. [Production Build & Deployment](#16--production-build--deployment)
17. [Project Structure Reference](#17--project-structure-reference)
18. [Troubleshooting](#18--troubleshooting)

---

## 1 — Prerequisites

Before starting, make sure you have the following installed. If not, follow [Step 2](#2--install-required-software).

| Software | Minimum Version | Check Command |
|---|---|---|
| PHP | 8.2+ | `php -v` |
| Composer | 2.x | `composer --version` |
| Node.js | 18+ (LTS) | `node -v` |
| npm | 9+ | `npm -v` |
| PostgreSQL | 15+ | `psql --version` |
| Git | 2.x | `git --version` |

---

## 2 — Install Required Software

> [!NOTE]
> Skip any tool you already have installed. Use the "Check Command" column above to verify.

### 2.1 — PHP 8.2+

**Option A — Using XAMPP (easiest for Windows):**

1. Download XAMPP from https://www.apachefriends.org/
2. Run the installer → select **PHP** and **Apache** (uncheck MySQL — we use PostgreSQL)
3. Install to `C:\xampp`
4. Add PHP to your system PATH:
   ```powershell
   # Open PowerShell as Administrator
   [System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\xampp\php", "Machine")
   ```
5. **Restart your terminal**, then verify:
   ```powershell
   php -v
   ```

**Option B — Standalone PHP:**

1. Download PHP 8.2+ (VS16 x64 Thread Safe) from https://windows.php.net/download
2. Extract to `C:\php`
3. Copy `php.ini-development` to `php.ini`
4. Add `C:\php` to your system PATH (same method as above)

### 2.2 — Enable Required PHP Extensions

Open your `php.ini` file (located in your PHP installation directory) and **uncomment** these lines by removing the `;` at the start:

```ini
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_pgsql
extension=pgsql
extension=zip
extension=gd
```

> [!IMPORTANT]
> The `pdo_pgsql` and `pgsql` extensions are **required** for PostgreSQL. If they are missing, Laravel will not connect to the database.

Save `php.ini` and verify extensions are loaded:

```powershell
php -m | findstr pgsql
```

Expected output:
```
pdo_pgsql
pgsql
```

### 2.3 — Composer

```powershell
# Download and run the Composer installer
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=C:\php --filename=composer
php -r "unlink('composer-setup.php');"
```

Or download the Windows installer from https://getcomposer.org/download/

Verify:
```powershell
composer --version
```

### 2.4 — Node.js & npm

1. Download Node.js LTS from https://nodejs.org/
2. Run the installer (npm is included)
3. Verify:
   ```powershell
   node -v
   npm -v
   ```

### 2.5 — PostgreSQL

1. Download from https://www.postgresql.org/download/windows/
2. Run the installer:
   - Set a **superuser password** (remember this — you'll need it later)
   - Default port: `5432`
   - Select **pgAdmin 4** during installation (useful for visual DB management)
3. Add PostgreSQL to PATH:
   ```powershell
   # Adjust the version number if different
   [System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\16\bin", "Machine")
   ```
4. **Restart your terminal**, then verify:
   ```powershell
   psql --version
   ```

### 2.6 — Git

1. Download from https://git-scm.com/download/win
2. Install with default settings
3. Verify:
   ```powershell
   git --version
   ```

---

## 3 — Create the Project Directory

Choose where you want the project to live. We'll use `C:\Projects` as the base:

```powershell
mkdir C:\Projects
cd C:\Projects
```

---

## 4 — Set Up the Laravel Backend

### 4.1 — Create a new Laravel project

```powershell
cd C:\Projects
composer create-project laravel/laravel workforce-optimizer
cd workforce-optimizer
```

This creates a full Laravel application in `C:\Projects\workforce-optimizer`.

### 4.2 — Verify Laravel is working

```powershell
php artisan --version
```

Expected output: `Laravel Framework 11.x.x` (or later)

### 4.3 — Generate application key

This was done automatically by `create-project`, but verify:

```powershell
php artisan key:generate
```

### 4.4 — Install additional Laravel packages

```powershell
# API resource helpers (already built-in in Laravel 11, but verify)
php artisan install:api

# CORS handling (built-in since Laravel 9)
# No extra package needed — configured in config/cors.php
```

---

## 5 — Configure the Environment File

Open `C:\Projects\workforce-optimizer\.env` in your text editor and update these values:

```dotenv
APP_NAME="Workforce Allocation Optimizer"
APP_ENV=local
APP_KEY=base64:... # (already generated)
APP_DEBUG=true
APP_URL=http://localhost:8000

# ─── Database ───────────────────────────────────────────────
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=workforce_optimizer
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password_here

# ─── Frontend URL (for CORS) ────────────────────────────────
FRONTEND_URL=http://localhost:5173

# ─── Session & Cache ────────────────────────────────────────
SESSION_DRIVER=database
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

> [!CAUTION]
> Replace `your_postgres_password_here` with the actual password you set during PostgreSQL installation. Never commit `.env` to version control.

---

## 6 — Set Up PostgreSQL Database

### 6.1 — Create the database

Open a terminal and connect to PostgreSQL:

```powershell
psql -U postgres
```

Enter your password when prompted, then run:

```sql
CREATE DATABASE workforce_optimizer;
```

Verify it was created:

```sql
\l
```

You should see `workforce_optimizer` in the list. Exit with:

```sql
\q
```

### 6.2 — (Optional) Create a dedicated database user

For better security, create a project-specific user instead of using `postgres`:

```powershell
psql -U postgres
```

```sql
CREATE USER workforce_user WITH PASSWORD 'a_secure_password';
GRANT ALL PRIVILEGES ON DATABASE workforce_optimizer TO workforce_user;

-- Connect to the database to grant schema permissions
\c workforce_optimizer
GRANT ALL ON SCHEMA public TO workforce_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO workforce_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO workforce_user;

\q
```

If using a dedicated user, update `.env`:

```dotenv
DB_USERNAME=workforce_user
DB_PASSWORD=a_secure_password
```

### 6.3 — Test the connection

```powershell
cd C:\Projects\workforce-optimizer
php artisan db:show
```

This should display database connection info without errors.

---

## 7 — Run Database Migrations

### 7.1 — Create migration files

Run these commands from the project root (`C:\Projects\workforce-optimizer`):

```powershell
php artisan make:migration create_employees_table
php artisan make:migration create_skills_table
php artisan make:migration create_employee_skill_table
php artisan make:migration create_projects_table
php artisan make:migration create_project_skill_requirements_table
php artisan make:migration create_allocations_table
php artisan make:migration create_employee_preferences_table
```

### 7.2 — Define the migration schemas

Open each migration file in `database/migrations/` and define the schemas. Below is the complete schema for each table:

#### `create_employees_table`

```php
public function up(): void
{
    Schema::create('employees', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('role');                // e.g., Developer, Designer, PM
        $table->string('department');           // e.g., Engineering, Design
        $table->integer('max_weekly_hours')->default(40);
        $table->enum('remote_preference', ['remote', 'onsite', 'hybrid'])->default('hybrid');
        $table->date('availability_start')->nullable();
        $table->date('availability_end')->nullable();
        $table->timestamps();
    });
}
```

#### `create_skills_table`

```php
public function up(): void
{
    Schema::create('skills', function (Blueprint $table) {
        $table->id();
        $table->string('name')->unique();       // e.g., React, PHP, Figma
        $table->string('category');              // e.g., Frontend, Backend, Design
        $table->timestamps();
    });
}
```

#### `create_employee_skill_table`

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
```

#### `create_projects_table`

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
```

#### `create_project_skill_requirements_table`

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
```

#### `create_allocations_table`

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
        $table->text('assignment_reason')->nullable();   // Explainability
        $table->decimal('allocation_score', 5, 2)->nullable(); // 0.00 – 100.00
        $table->timestamps();
    });
}
```

#### `create_employee_preferences_table`

```php
public function up(): void
{
    Schema::create('employee_preferences', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained()->onDelete('cascade')->unique();
        $table->json('preferred_technologies')->nullable();  // ["React", "Node.js"]
        $table->string('preferred_project_type')->nullable(); // e.g., "web", "mobile", "data"
        $table->integer('max_weekly_hours_override')->nullable();
        $table->timestamps();
    });
}
```

### 7.3 — Run the migrations

```powershell
php artisan migrate
```

Expected output:

```
Migration table created successfully.
Running migrations...
   ...create_employees_table ............... DONE
   ...create_skills_table .................. DONE
   ...create_employee_skill_table .......... DONE
   ...create_projects_table ................ DONE
   ...create_project_skill_requirements_table DONE
   ...create_allocations_table ............. DONE
   ...create_employee_preferences_table .... DONE
```

> [!TIP]
> If you need to start fresh at any point, run `php artisan migrate:fresh` to drop all tables and re-run migrations. Add `--seed` to also run seeders.

---

## 8 — Create Eloquent Models

### 8.1 — Generate model files

```powershell
php artisan make:model Employee
php artisan make:model Skill
php artisan make:model Project
php artisan make:model Allocation
php artisan make:model EmployeePreference
```

### 8.2 — Define models and relationships

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

    /**
     * Total hours currently allocated across all confirmed/proposed allocations.
     */
    public function getCurrentWorkloadAttribute(): int
    {
        return $this->allocations()
            ->whereIn('status', ['proposed', 'confirmed'])
            ->sum('allocated_hours');
    }

    /**
     * Hours remaining before hitting weekly cap.
     */
    public function getRemainingCapacityAttribute(): int
    {
        $maxHours = $this->preferences?->max_weekly_hours_override
                    ?? $this->max_weekly_hours;
        return max(0, $maxHours - $this->current_workload);
    }

    /**
     * Utilization as a percentage (0–100).
     */
    public function getUtilizationPercentageAttribute(): float
    {
        $maxHours = $this->preferences?->max_weekly_hours_override
                    ?? $this->max_weekly_hours;
        if ($maxHours === 0) return 0;
        return round(($this->current_workload / $maxHours) * 100, 1);
    }

    protected $appends = ['current_workload', 'remaining_capacity', 'utilization_percentage'];
}
```

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

    /**
     * Percentage of estimated hours covered by allocations.
     */
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

---

## 9 — Build API Controllers & Routes

### 9.1 — Generate controllers

```powershell
php artisan make:controller Api/EmployeeController --api --model=Employee
php artisan make:controller Api/SkillController --api --model=Skill
php artisan make:controller Api/ProjectController --api --model=Project
php artisan make:controller Api/AllocationController --api --model=Allocation
php artisan make:controller Api/DashboardController
php artisan make:controller Api/OptimizeController
php artisan make:controller Api/AnalyticsController
```

### 9.2 — Define API routes

Open `routes/api.php` and add:

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

### 9.3 — Implement controller methods

You need to implement the logic in each controller. Here's the pattern for `EmployeeController` as an example:

#### `app/Http/Controllers/Api/EmployeeController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index()
    {
        return Employee::with(['skills', 'preferences'])->get();
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
        return response()->json($employee, 201);
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
        return response()->json($employee);
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->json(null, 204);
    }

    /**
     * Attach skills to an employee.
     *
     * Expects: { "skills": [ { "skill_id": 1, "proficiency_level": "advanced", "years_of_experience": 3 } ] }
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
```

> [!TIP]
> Follow the same pattern for `SkillController`, `ProjectController`, and `AllocationController`. Each one uses `validate()` → `create()`/`update()`/`delete()` with the appropriate model.

---

## 10 — Create the Optimizer Services

These are the PHP classes that handle workforce allocation optimization.

### 10.1 — Create the service directory

```powershell
mkdir app\Services\Optimizer -Force
```

### 10.2 — ScoringService

Create `app/Services/Optimizer/ScoringService.php`:

```php
<?php

namespace App\Services\Optimizer;

use App\Models\Employee;
use App\Models\Project;
use Illuminate\Support\Collection;

class ScoringService
{
    /**
     * Weights for the composite score.
     */
    private const WEIGHTS = [
        'skill_match'       => 0.50,
        'availability'      => 0.20,
        'workload_balance'  => 0.15,
        'experience'        => 0.10,
        'preference'        => 0.05,
    ];

    /**
     * Calculate full composite score with explanations.
     */
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

    /**
     * How well the employee's skills match the project's requirements.
     */
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

    /**
     * Is the employee available (within date range)?
     */
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

    /**
     * Prefer employees who are less loaded (promotes even distribution).
     */
    public function calculateWorkloadBalance(Employee $employee, Collection $allEmployees): array
    {
        $utilization = $employee->utilization_percentage;
        $score = max(0, 100 - $utilization);

        return [
            'score' => round($score, 2),
            'reason' => "Current utilization: {$utilization}%" . ($utilization < 50 ? ' — room for more work' : ($utilization > 80 ? ' — nearing capacity' : '')),
        ];
    }

    /**
     * More years of experience in relevant skills = higher score.
     */
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
        $score = min(100, $avgYears * 15); // 6.67+ years = 100

        return [
            'score' => round($score, 2),
            'reason' => "Average " . round($avgYears, 1) . " years experience in required skills",
        ];
    }

    /**
     * Does the employee's preferred technologies match the project?
     */
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
```

### 10.3 — AllocatorService

Create `app/Services/Optimizer/AllocatorService.php`:

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

    /**
     * Run greedy allocation across all provided projects.
     * Projects are processed in priority order (critical → low).
     *
     * @return array List of proposed allocations
     */
    public function allocate(Collection $projects, Collection $employees): array
    {
        $priorityOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];

        $sortedProjects = $projects->sortBy(
            fn(Project $p) => $priorityOrder[$p->priority] ?? 99
        );

        // Track remaining capacity per employee during allocation
        $capacityTracker = [];
        foreach ($employees as $emp) {
            $capacityTracker[$emp->id] = $emp->remaining_capacity;
        }

        $proposedAllocations = [];

        foreach ($sortedProjects as $project) {
            // Score every available employee for this project
            $candidates = [];

            foreach ($employees as $employee) {
                if ($capacityTracker[$employee->id] <= 0) {
                    continue; // Skip fully allocated employees
                }

                $result = $this->scoringService->compositeScore($employee, $project, $employees);
                $candidates[] = [
                    'employee' => $employee,
                    'score'    => $result['score'],
                    'reasons'  => $result['reasons'],
                    'details'  => $result['details'],
                ];
            }

            // Sort by score (descending)
            usort($candidates, fn($a, $b) => $b['score'] <=> $a['score']);

            // Assign top candidates until project hours are covered
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

### 10.4 — OptimizerService

Create `app/Services/Optimizer/OptimizerService.php`:

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

    /**
     * Run full optimization across active projects.
     */
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

    /**
     * Accept proposed allocations and persist them.
     */
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
                'assignment_reason' => $proposal['assignment_reason'],
                'allocation_score'  => $proposal['allocation_score'],
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

### 10.5 — Register services (optional, auto-discovery works)

Laravel automatically resolves these via constructor injection. No manual registration needed if the classes have no interfaces.

---

## 11 — Set Up the React Frontend

### 11.1 — Create the React app

From the project root:

```powershell
cd C:\Projects\workforce-optimizer

# Create the React frontend in a 'frontend' subdirectory
npx -y create-vite@latest frontend -- --template react

cd frontend
npm install
```

### 11.2 — Install dependencies

```powershell
cd C:\Projects\workforce-optimizer\frontend

# Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite

# HTTP client
npm install axios

# Routing
npm install react-router-dom

# Charts (for dashboard)
npm install recharts

# Icons (optional but recommended)
npm install lucide-react
```

### 11.3 — Configure Tailwind CSS

Add the Tailwind plugin to `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

Replace the contents of `src/index.css` with:

```css
@import "tailwindcss";
```

### 11.4 — Set up the Axios API client

Create `src/api/client.js`:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',     // Proxied to Laravel in dev
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default api;
```

### 11.5 — Set up routing

Replace `src/App.jsx` with:

```jsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import ProjectsPage from './pages/ProjectsPage';
import AllocationsPage from './pages/AllocationsPage';
import OptimizePage from './pages/OptimizePage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Sidebar / top nav */}
        <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Workforce Optimizer
            </h1>
            <div className="flex gap-4">
              {['/', '/employees', '/projects', '/allocations', '/optimize'].map((path, i) => {
                const labels = ['Dashboard', 'Employees', 'Projects', 'Allocations', 'Optimize'];
                return (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`
                    }
                  >
                    {labels[i]}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/allocations" element={<AllocationsPage />} />
            <Route path="/optimize" element={<OptimizePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

### 11.6 — Create placeholder page components

Create placeholder files so the app compiles. You'll build these out during development:

```powershell
cd C:\Projects\workforce-optimizer\frontend
mkdir src\pages -Force
mkdir src\components -Force
```

Create each placeholder page (e.g., `src/pages/DashboardPage.jsx`):

```jsx
export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p className="text-gray-400">Dashboard coming soon...</p>
    </div>
  );
}
```

Repeat for: `EmployeesPage.jsx`, `ProjectsPage.jsx`, `AllocationsPage.jsx`, `OptimizePage.jsx`.

---

## 12 — Connect Frontend to Backend (CORS)

### 12.1 — Configure Laravel CORS

Open `config/cors.php` (if it exists) or publish it:

```powershell
php artisan config:publish cors
```

Update `config/cors.php`:

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

> [!NOTE]
> In development, the Vite proxy (`/api` → `localhost:8000`) handles most requests. CORS configuration is mainly needed for direct browser requests and production.

---

## 13 — Seed the Database with Demo Data

### 13.1 — Create factories

```powershell
cd C:\Projects\workforce-optimizer
php artisan make:factory EmployeeFactory --model=Employee
php artisan make:factory SkillFactory --model=Skill
php artisan make:factory ProjectFactory --model=Project
```

### 13.2 — Create the seeder

```powershell
php artisan make:seeder DemoDataSeeder
```

Open `database/seeders/DemoDataSeeder.php` and add realistic demo data:

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

        foreach ($employeeData as $i => $data) {
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
            ['name' => 'E-Commerce Platform Redesign',   'priority' => 'critical', 'hours' => 200],
            ['name' => 'Mobile App API v2',              'priority' => 'high',     'hours' => 150],
            ['name' => 'Internal Dashboard',             'priority' => 'medium',   'hours' => 100],
            ['name' => 'Data Pipeline Migration',        'priority' => 'high',     'hours' => 120],
            ['name' => 'Landing Page Refresh',           'priority' => 'low',      'hours' =>  40],
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
```

### 13.3 — Register and run the seeder

Open `database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    $this->call(DemoDataSeeder::class);
}
```

Run:

```powershell
php artisan db:seed
```

Or reset everything and seed at once:

```powershell
php artisan migrate:fresh --seed
```

---

## 14 — Run the Development Servers

You need **two terminals** running simultaneously:

### Terminal 1 — Laravel Backend

```powershell
cd C:\Projects\workforce-optimizer
php artisan serve
```

This starts the API at **http://localhost:8000**.

### Terminal 2 — React Frontend

```powershell
cd C:\Projects\workforce-optimizer\frontend
npm run dev
```

This starts the frontend at **http://localhost:5173**.

### Verify everything works

1. Open **http://localhost:5173** in your browser → you should see the app shell
2. Test the API directly:
   ```powershell
   curl http://localhost:8000/api/employees
   ```
   → Should return JSON array of seeded employees

---

## 15 — Run Tests

### 15.1 — Backend tests (Laravel)

```powershell
cd C:\Projects\workforce-optimizer

# Configure test database (uses SQLite in-memory by default)
# Or set DB_CONNECTION=pgsql in .env.testing for PostgreSQL

# Run all tests
php artisan test

# Run specific test suites
php artisan test --filter=EmployeeTest
php artisan test --filter=ScoringServiceTest
```

### 15.2 — Create a sample test

```powershell
php artisan make:test EmployeeApiTest
```

Open `tests/Feature/EmployeeApiTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_employees(): void
    {
        Employee::factory()->count(3)->create();

        $response = $this->getJson('/api/employees');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    public function test_can_create_employee(): void
    {
        $response = $this->postJson('/api/employees', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'Developer',
            'department' => 'Engineering',
        ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'Test User']);
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->postJson('/api/employees', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name', 'email', 'role', 'department']);
    }
}
```

### 15.3 — Frontend tests (React)

```powershell
cd C:\Projects\workforce-optimizer\frontend

# Install testing deps if not already present
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run tests
npx vitest run
```

---

## 16 — Production Build & Deployment

### 16.1 — Build the React frontend

```powershell
cd C:\Projects\workforce-optimizer\frontend
npm run build
```

This creates a `dist/` directory with optimized static files.

### 16.2 — Serve frontend from Laravel (optional)

Copy the built files into Laravel's public directory:

```powershell
# Copy built assets
Copy-Item -Recurse frontend\dist\* public\ -Force
```

Update `routes/web.php` to serve the SPA:

```php
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');
```

### 16.3 — Environment for production

Create or update `.env` for production:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=workforce_optimizer
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```

Run production optimizations:

```powershell
# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations on production
php artisan migrate --force
```

### 16.4 — Docker deployment (optional)

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DB_CONNECTION=pgsql
      - DB_HOST=db
      - DB_PORT=5432
      - DB_DATABASE=workforce_optimizer
      - DB_USERNAME=postgres
      - DB_PASSWORD=secret
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: workforce_optimizer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Create a `Dockerfile`:

```dockerfile
FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev libzip-dev \
    && docker-php-ext-install pdo_pgsql pgsql zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

WORKDIR /app
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Build frontend
RUN cd frontend && npm ci && npm run build
RUN cp -r frontend/dist/* public/

# Generate key and cache
RUN php artisan key:generate --force
RUN php artisan config:cache
RUN php artisan route:cache

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
```

Run with Docker:

```powershell
docker-compose up --build
```

---

## 17 — Project Structure Reference

After completing setup, your project structure will look like this:

```
workforce-optimizer/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           ├── EmployeeController.php
│   │           ├── SkillController.php
│   │           ├── ProjectController.php
│   │           ├── AllocationController.php
│   │           ├── DashboardController.php
│   │           ├── OptimizeController.php
│   │           └── AnalyticsController.php
│   ├── Models/
│   │   ├── Employee.php
│   │   ├── Skill.php
│   │   ├── Project.php
│   │   ├── Allocation.php
│   │   └── EmployeePreference.php
│   └── Services/
│       └── Optimizer/
│           ├── ScoringService.php      ← Scoring formulas
│           ├── AllocatorService.php    ← Greedy allocation engine
│           └── OptimizerService.php    ← Orchestrator
├── database/
│   ├── migrations/                     ← 7 migration files
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── DemoDataSeeder.php
├── routes/
│   └── api.php                         ← All API endpoints
├── frontend/                           ← React app (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js               ← Axios instance
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── EmployeesPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── AllocationsPage.jsx
│   │   │   └── OptimizePage.jsx
│   │   ├── components/
│   │   │   ├── SkillBadge.jsx
│   │   │   ├── UtilizationBar.jsx
│   │   │   ├── HeatmapGrid.jsx
│   │   │   ├── OverviewCard.jsx
│   │   │   └── ProjectStatusTable.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── .env
├── docker-compose.yml                  ← (Optional)
├── Dockerfile                          ← (Optional)
└── composer.json
```

---

## 18 — Troubleshooting

### Common issues and fixes

| Problem | Cause | Fix |
|---|---|---|
| `could not find driver` | `pdo_pgsql` extension not enabled | Uncomment `extension=pdo_pgsql` in `php.ini`, restart terminal |
| `SQLSTATE[08006] Connection refused` | PostgreSQL not running | Start PostgreSQL service: `net start postgresql-x64-16` |
| `CORS error` in browser | Frontend calling API directly | Use the Vite proxy (already configured) or update `config/cors.php` |
| `npm run dev` shows blank page | React app not built yet | Make sure all page components exist (even as placeholders) |
| `Class not found` errors | Autoload not updated | Run `composer dump-autoload` |
| `php artisan serve` fails | Port 8000 in use | Use `php artisan serve --port=8001` |
| `VITE_` env vars not loaded | Wrong prefix | Vite requires `VITE_` prefix for client-side env vars |
| Migration fails with duplicate table | Ran migrations twice | Run `php artisan migrate:fresh` (drops all tables first) |

### Useful commands cheatsheet

```powershell
# ── Laravel ──────────────────────────────
php artisan serve                    # Start backend dev server
php artisan migrate                  # Run pending migrations
php artisan migrate:fresh --seed     # Reset DB + seed
php artisan db:seed                  # Run seeders only
php artisan tinker                   # Interactive PHP shell
php artisan route:list               # Show all registered routes
php artisan test                     # Run all tests
php artisan make:model X -mfc        # Model + migration + factory + controller

# ── React Frontend ───────────────────────
npm run dev                          # Start frontend dev server
npm run build                        # Production build
npx vitest run                       # Run tests

# ── PostgreSQL ───────────────────────────
psql -U postgres                     # Connect to PostgreSQL
\l                                   # List databases
\c workforce_optimizer               # Connect to database
\dt                                  # List tables
\q                                   # Quit
```

---

> [!TIP]
> **Next steps after setup:**
> 1. Flesh out the placeholder React pages (EmployeesPage, ProjectsPage, etc.)
> 2. Style with Tailwind CSS — use the dark theme variables from `App.jsx` as a base
> 3. Test the optimizer: `php artisan tinker` → `app(OptimizerService::class)->run()`
> 4. Build the analytics dashboard with Recharts
