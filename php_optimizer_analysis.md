# PHP as the Optimizer Engine — Why It Works

## The Problem with a Separate Python Service

Adding a Python microservice (Flask/FastAPI + OR-Tools) introduces:

| Concern | Impact |
|---|---|
| **Two runtimes** | Must install & maintain PHP *and* Python on every environment |
| **HTTP overhead** | Laravel → HTTP request → Python → HTTP response adds latency and failure points |
| **Deployment complexity** | Two processes to start, monitor, and restart; two sets of dependencies |
| **Error handling** | Network failures, timeouts, serialization bugs between services |
| **Hosting cost** | Many shared/budget hosts support PHP natively but not Python |
| **Debugging** | Stack traces split across two languages; harder to trace end-to-end |

For a portfolio project that you'll demo in interviews, **simplicity is a feature**. A single `php artisan serve` that runs everything is far more impressive than fumbling with two terminals and a Docker compose file.

---

## What the Optimizer Actually Does

Let's be clear about what the "optimization" involves:

1. **Score each employee** against each project requirement (weighted formula)
2. **Rank candidates** per project
3. **Allocate greedily** — assign top candidates while respecting capacity constraints
4. **Explain decisions** — produce human-readable reasons

None of this requires Python-specific libraries. It's arithmetic, sorting, and constraint checking — all trivially done in PHP.

---

## The Scoring Formula in PHP

```php
// app/Services/Optimizer/ScoringService.php

class ScoringService
{
    private const WEIGHTS = [
        'skill_match'      => 0.50,
        'availability'     => 0.20,
        'workload_balance' => 0.15,
        'experience'       => 0.10,
        'preference'       => 0.05,
    ];

    public function score(Employee $employee, Project $project): AllocationScore
    {
        $scores = [
            'skill_match'      => $this->skillMatch($employee, $project),
            'availability'     => $this->availability($employee),
            'workload_balance' => $this->workloadBalance($employee),
            'experience'       => $this->experience($employee, $project),
            'preference'       => $this->preference($employee, $project),
        ];

        $final = collect($scores)
            ->map(fn ($score, $key) => $score * self::WEIGHTS[$key])
            ->sum();

        return new AllocationScore(
            score: round($final, 2),
            breakdown: $scores,
            reasons: $this->buildReasons($employee, $project, $scores),
        );
    }
}
```

This is clean, testable, and lives inside your Laravel app. No HTTP calls, no serialization, no second runtime.

---

## Skill Matching — Pure PHP

```php
private function skillMatch(Employee $employee, Project $project): float
{
    $requirements = $project->skillRequirements; // Collection
    if ($requirements->isEmpty()) return 0;

    $proficiencyLevels = [
        'beginner'     => 1,
        'intermediate' => 2,
        'advanced'     => 3,
        'expert'       => 4,
    ];

    $totalScore = 0;
    $maxScore = 0;

    foreach ($requirements as $req) {
        $requiredLevel = $proficiencyLevels[$req->required_proficiency];
        $maxScore += $requiredLevel;

        $employeeSkill = $employee->skills
            ->firstWhere('id', $req->skill_id);

        if ($employeeSkill) {
            $employeeLevel = $proficiencyLevels[$employeeSkill->pivot->proficiency_level];
            // Cap at required level (exceeding doesn't give bonus)
            $totalScore += min($employeeLevel, $requiredLevel);
        }
    }

    return $maxScore > 0 ? ($totalScore / $maxScore) * 100 : 0;
}
```

No numpy. No pandas. Just Eloquent collections and basic math.

---

## The Greedy Allocator in PHP

```php
// app/Services/Optimizer/AllocationEngine.php

class AllocationEngine
{
    public function __construct(
        private ScoringService $scorer,
    ) {}

    public function optimize(Collection $projects, Collection $employees): OptimizationResult
    {
        // Sort projects by priority (critical first)
        $sorted = $projects->sortBy(fn ($p) => match($p->priority) {
            'critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3,
        });

        $allocations = collect();
        $capacities = $employees->mapWithKeys(fn ($e) => [
            $e->id => $e->max_weekly_hours - $e->current_workload,
        ]);

        foreach ($sorted as $project) {
            foreach ($project->skillRequirements as $requirement) {
                // Score all employees with remaining capacity
                $candidates = $employees
                    ->filter(fn ($e) => $capacities[$e->id] > 0)
                    ->map(fn ($e) => [
                        'employee' => $e,
                        'score'    => $this->scorer->score($e, $project),
                    ])
                    ->sortByDesc('score.score');

                $hoursNeeded = $requirement->required_hours;

                foreach ($candidates as $candidate) {
                    if ($hoursNeeded <= 0) break;

                    $available = $capacities[$candidate['employee']->id];
                    $assign = min($available, $hoursNeeded);

                    if ($assign > 0) {
                        $allocations->push(new ProposedAllocation(
                            employee: $candidate['employee'],
                            project: $project,
                            hours: $assign,
                            score: $candidate['score'],
                        ));

                        $capacities[$candidate['employee']->id] -= $assign;
                        $hoursNeeded -= $assign;
                    }
                }
            }
        }

        return new OptimizationResult(
            allocations: $allocations,
            metrics: $this->calculateMetrics($allocations, $projects, $employees),
        );
    }
}
```

This is the entire optimizer — no microservice, no HTTP, no Python.

---

## What About "Real" Optimization (ILP)?

This is the only legitimate argument for Python — libraries like OR-Tools or PuLP make Integer Linear Programming easy. But consider:

### Option A: PHP Linear Programming Libraries

| Library | Type | Notes |
|---|---|---|
| [PHPSimplex](https://github.com/alefcastelo/phpsimplex) | Simplex method | Basic LP solver |
| [php-optimization](https://packagist.org/packages/mcordingley/linearalgebra) | Matrix operations | Building blocks for custom solvers |
| Custom implementation | Hungarian Algorithm | ~200 lines of PHP for assignment problems |

### Option B: The Weighted Greedy Approach Is Good Enough

For a workforce allocation tool with ~100-500 employees and ~20-50 projects, a well-tuned greedy algorithm with scoring produces results that are **95%+ as good** as ILP — and is:

- Easier to explain in interviews ("here's how the scoring works")
- Easier to debug ("why was John assigned?")
- Faster to execute (no solver overhead)
- More understandable to managers using the tool

> [!TIP]
> In interview settings, being able to clearly explain *why* your algorithm makes each decision is more valuable than claiming you used a mathematically optimal solver that you can't fully explain.

### Option C: Shell Out to Python Only If Needed Later

If you eventually want ILP, you can still call Python as a CLI command from Laravel:

```php
// Only if you ever need ILP — Phase 4 upgrade path
$result = Process::run('python optimizer/solve.py --input ' . $inputFile);
```

This is simpler than running a full HTTP microservice. But you likely won't need it.

---

## Architecture Comparison

### With Python Microservice (Complex)

```
Browser → React → Laravel API → HTTP → Python Flask → OR-Tools
                                  ↕
                              PostgreSQL
```

- 4 processes to run during development
- 2 languages to maintain
- Network calls between services

### With PHP Optimizer (Simple)

```
Browser → React → Laravel API → PHP Optimizer Service
                       ↕
                   PostgreSQL
```

- 2 processes to run (`php artisan serve` + `npm run dev`)
- 1 backend language
- Direct method calls, no network overhead

---

## Laravel Features That Make PHP Even Better

Laravel gives you tools that make building the optimizer *easier* in PHP than in a separate service:

| Feature | How It Helps |
|---|---|
| **Eloquent Relationships** | `$employee->skills`, `$project->requirements` — no data serialization needed |
| **Collections** | `->filter()`, `->sortBy()`, `->map()`, `->sum()` — functional data processing |
| **Queues** | Run optimization in the background with `dispatch(new OptimizeAllocations)` |
| **Events** | Fire `AllocationOptimized` event to trigger notifications |
| **Caching** | Cache scoring results for unchanged employee/project data |
| **Testing** | `php artisan test` covers the optimizer with no extra test framework |
| **Artisan Commands** | `php artisan optimize:allocations` for CLI access |

---

## Service Class Structure (Where the Optimizer Lives)

```
app/
└── Services/
    └── Optimizer/
        ├── ScoringService.php          # Individual scoring functions
        ├── AllocationEngine.php        # Greedy allocation logic
        ├── ExplanationBuilder.php      # Human-readable assignment reasons
        ├── SimulationService.php       # What-if scenarios
        ├── DTOs/
        │   ├── AllocationScore.php     # Score breakdown data object
        │   ├── ProposedAllocation.php  # Proposed assignment data object
        │   └── OptimizationResult.php  # Full result with metrics
        └── Contracts/
            └── OptimizerInterface.php  # Interface for swappable strategies
```

This is clean, follows SOLID principles, and is entirely within your Laravel app.

---

## Performance: Is PHP Fast Enough?

For this workload, **absolutely yes**.

| Scenario | Employees | Projects | Estimated Time (PHP) |
|---|---|---|---|
| Small company | 50 | 10 | < 100ms |
| Medium company | 200 | 30 | < 500ms |
| Large company | 500 | 50 | < 2s |
| Enterprise | 1000+ | 100+ | Queue it (background job) |

PHP 8.4 with JIT compilation handles this scale easily. For anything over ~500 employees, dispatch it as a Laravel queue job and show a progress indicator — which you'd need to do with Python too.

---

## Summary

| Factor | Python Microservice | PHP (Laravel Native) |
|---|---|---|
| Deployment | Complex (2 runtimes) | Simple (1 runtime) |
| Development speed | Slower (two codebases) | Faster (one codebase) |
| Debugging | Split across languages | Single stack trace |
| Data access | Requires serialization | Direct Eloquent access |
| Performance | Faster for heavy math | Fast enough for this scale |
| Portfolio demo | Harder to set up live | `php artisan serve` and done |
| Interview explanation | "I used a library" | "I built the algorithm" |
| ILP support | Native (OR-Tools) | Limited (but unnecessary for MVP) |
| Background processing | Custom (Celery/RQ) | Built-in (Laravel Queues) |

> [!IMPORTANT]
> **Recommendation**: Build the optimizer in PHP. It keeps the project simple, demonstrates deeper understanding of algorithm design, and makes the portfolio piece easy to demo. If you ever need ILP, add it as a Phase 4 upgrade via a simple CLI call — not a full microservice.
