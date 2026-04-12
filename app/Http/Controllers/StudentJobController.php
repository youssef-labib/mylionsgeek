<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class StudentJobController extends Controller
{
    public function index(Request $request): Response
    {
        $filterJobTypes = $this->distinctJobTypes();
        $filterSkills = $this->distinctSkills();

        $jobType = $request->query('job_type');
        if (is_string($jobType) && $jobType !== '' && ! $filterJobTypes->contains($jobType)) {
            $jobType = null;
        }

        $requestedSkills = $request->query('skills', []);
        if (! is_array($requestedSkills)) {
            $requestedSkills = $requestedSkills !== null && $requestedSkills !== '' ? [(string) $requestedSkills] : [];
        }
        $requestedSkills = array_values(array_unique(array_filter(array_map('strval', $requestedSkills))));
        $requestedSkills = array_values(array_intersect($requestedSkills, $filterSkills->all()));

        $query = Job::query()
            ->published()
            ->latest();

        if ($jobType) {
            $query->where('job_type', $jobType);
        }

        if ($requestedSkills !== []) {
            $query->where(function ($q) use ($requestedSkills) {
                foreach ($requestedSkills as $skill) {
                    $q->orWhereJsonContains('skills', $skill);
                }
            });
        }

        $jobs = $query->get()->map(fn (Job $job) => $this->serializeJobSummary($job));

        return Inertia::render('students/Jobs/index', [
            'jobs' => $jobs,
            'filterOptions' => [
                'job_types' => $filterJobTypes->values()->all(),
                'skills' => $filterSkills->values()->all(),
            ],
            'appliedFilters' => [
                'job_type' => $jobType,
                'skills' => $requestedSkills,
            ],
        ]);
    }

    public function show(Request $request, Job $job): Response
    {
        if (! $job->is_published) {
            abort(404);
        }

        $user = $request->user();
        $roles = $user ? (is_array($user->role) ? $user->role : [$user->role]) : [];
        $isStudent = in_array('student', $roles, true);
        $hasApplied = $user && $isStudent
            ? $job->applications()->where('user_id', $user->id)->exists()
            : false;

        $isManager = false;
        $manage = null;
        if ($user) {
            $uid = (int) $user->id;
            $isAdminCreator = $job->user_id !== null && (int) $job->user_id === $uid;
            $isAssignedRecruiter = $job->recruiters()->where('users.id', $uid)->exists();
            $isManager = $isAdminCreator || $isAssignedRecruiter;
            if ($isAdminCreator) {
                $manage = ['href' => '/admin/jobs', 'label' => 'Manage in admin'];
            } elseif ($isAssignedRecruiter) {
                $manage = ['href' => '/recruiter/jobs', 'label' => 'Open assigned jobs'];
            }
        }

        return Inertia::render('students/Jobs/partials/[id]', [
            'job' => $this->serializeJobDetail($job, $hasApplied, $isManager, $manage),
        ]);
    }

    public function apply(Request $request, Job $job): RedirectResponse
    {
        $user = $request->user();
        $roles = is_array($user->role) ? $user->role : [$user->role];
        if (! in_array('student', $roles, true)) {
            abort(403);
        }

        if (! $job->is_published) {
            abort(404);
        }
        if ($job->user_id !== null && (int) $job->user_id === (int) $user->id) {
            abort(403);
        }
        if ($job->recruiters()->where('users.id', $user->id)->exists()) {
            abort(403);
        }

        $validated = $request->validate([
            'cover_letter' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($job->applications()->where('user_id', $user->id)->exists()) {
            return back()->with('error', __('You have already applied to this job.'));
        }

        $job->applications()->create([
            'user_id' => $user->id,
            'cover_letter' => $validated['cover_letter'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', __('Your application was submitted.'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeJobSummary(Job $job): array
    {
        $skills = $job->skills ?? [];
        $description = $job->description ?? '';
        $excerpt = mb_strlen($description) > 220 ? mb_substr($description, 0, 217).'…' : $description;

        return [
            'id' => $job->id,
            'reference' => $job->reference,
            'title' => $job->title,
            'excerpt' => $excerpt,
            'location' => $job->location,
            'job_type' => $job->job_type,
            'skills' => $skills,
            'created_at' => $job->created_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    /**
     * @param  array{href: string, label: string}|null  $manage
     */
    private function serializeJobDetail(Job $job, bool $hasApplied = false, bool $isManager = false, ?array $manage = null): array
    {
        return [
            'id' => $job->id,
            'reference' => $job->reference,
            'title' => $job->title,
            'description' => $job->description,
            'location' => $job->location,
            'job_type' => $job->job_type,
            'skills' => $job->skills ?? [],
            'created_at' => $job->created_at->toIso8601String(),
            'has_applied' => $hasApplied,
            'is_owner' => $isManager,
            'manage' => $manage,
        ];
    }

    private function distinctJobTypes(): Collection
    {
        return Job::query()
            ->published()
            ->whereNotNull('job_type')
            ->where('job_type', '!=', '')
            ->distinct()
            ->orderBy('job_type')
            ->pluck('job_type');
    }

    private function distinctSkills(): Collection
    {
        $rows = Job::query()
            ->published()
            ->pluck('skills');

        return $rows
            ->filter()
            ->flatten()
            ->map(fn ($s) => is_string($s) ? trim($s) : $s)
            ->filter(fn ($s) => $s !== null && $s !== '')
            ->unique()
            ->sort()
            ->values();
    }
}
