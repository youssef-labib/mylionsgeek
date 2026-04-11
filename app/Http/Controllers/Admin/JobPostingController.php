<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class JobPostingController extends Controller
{
    private const JOB_TYPES = ['full_time', 'part_time', 'internship', 'contract'];

    public function index(): Response
    {
        $jobs = Job::query()
            ->with([
                'creator:id,name,email',
                'recruiters:id,name,email',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Job $job) => $this->serializeJobForAdminList($job));

        return Inertia::render('admin/jobs/index', [
            'jobs' => $jobs,
            'recruiterOptions' => $this->recruiterOptions(),
            'jobTypeOptions' => self::JOB_TYPES,
        ]);
    }

    public function create(): RedirectResponse
    {
        return redirect()->route('admin.jobs.index');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedJobRequest($request);
        $recruiterIds = $validated['recruiter_ids'] ?? [];

        $job = Job::query()->create([
            'reference' => Job::generateUniqueReference(),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'location' => $validated['location'] ?? null,
            'job_type' => $validated['job_type'],
            'skills' => array_values(array_filter($validated['skills'] ?? [])),
            'deadline' => $validated['deadline'] ?? null,
            'is_published' => (bool) ($validated['is_published'] ?? true),
            'user_id' => $request->user()->id,
        ]);

        $job->recruiters()->sync($recruiterIds);

        return redirect()->route('admin.jobs.index')->with('success', 'Job posting created.');
    }

    public function edit(Job $job): Response
    {
        $job->load(['recruiters:id']);

        return Inertia::render('admin/jobs/edit', [
            'job' => [
                'id' => $job->id,
                'reference' => $job->reference,
                'title' => $job->title,
                'description' => $job->description,
                'location' => $job->location,
                'job_type' => $job->job_type,
                'skills' => $job->skills ?? [],
                'deadline' => $job->deadline?->format('Y-m-d'),
                'is_published' => (bool) $job->is_published,
                'recruiter_ids' => $job->recruiters->pluck('id')->all(),
            ],
            'recruiterOptions' => $this->recruiterOptions(),
            'jobTypeOptions' => self::JOB_TYPES,
        ]);
    }

    public function update(Request $request, Job $job): RedirectResponse
    {
        $validated = $this->validatedJobRequest($request);
        $recruiterIds = $validated['recruiter_ids'] ?? [];

        $job->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'location' => $validated['location'] ?? null,
            'job_type' => $validated['job_type'],
            'skills' => array_values(array_filter($validated['skills'] ?? [])),
            'deadline' => $validated['deadline'] ?? null,
            'is_published' => (bool) ($validated['is_published'] ?? true),
        ]);

        $job->recruiters()->sync($recruiterIds);

        return redirect()->route('admin.jobs.index')->with('success', 'Job posting updated.');
    }

    /**
     * @return array<int, array{id: int, name: string, email: string}>
     */
    private function recruiterOptions(): array
    {
        return User::query()
            ->whereJsonContains('role', 'recruiter')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => (int) $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedJobRequest(Request $request): array
    {
        $skillsInput = $request->input('skills');
        if (is_string($skillsInput)) {
            $parsed = array_values(array_unique(array_filter(array_map('trim', explode(',', $skillsInput)))));
            $request->merge(['skills' => $parsed]);
        }

        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'job_type' => ['required', 'string', Rule::in(self::JOB_TYPES)],
            'skills' => ['nullable', 'array'],
            'skills.*' => ['string', 'max:80'],
            'deadline' => ['nullable', 'date'],
            'is_published' => ['sometimes', 'boolean'],
            'recruiter_ids' => ['nullable', 'array'],
            'recruiter_ids.*' => [
                'integer',
                Rule::exists('users', 'id')->where(fn ($q) => $q->whereJsonContains('role', 'recruiter')),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeJobForAdminList(Job $job): array
    {
        return [
            'id' => $job->id,
            'reference' => $job->reference,
            'title' => $job->title,
            'job_type' => $job->job_type,
            'location' => $job->location,
            'deadline' => $job->deadline?->format('Y-m-d'),
            'is_published' => (bool) $job->is_published,
            'skills' => $job->skills ?? [],
            'created_at' => $job->created_at?->toIso8601String(),
            'creator' => $job->creator ? [
                'id' => $job->creator->id,
                'name' => $job->creator->name,
                'email' => $job->creator->email,
            ] : null,
            'recruiters' => $job->recruiters->map(fn (User $r) => [
                'id' => $r->id,
                'name' => $r->name,
                'email' => $r->email,
            ])->values()->all(),
        ];
    }
}
