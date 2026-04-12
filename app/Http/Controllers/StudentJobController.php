<?php

namespace App\Http\Controllers;

use App\Mail\NewJobApplicationMail;
use App\Models\Job;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;
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
        $hasApplied = $user && $job->applications()->where('user_id', $user->id)->exists();

        // Public job detail: Apply when the user may submit a new application (same rules as apply()).
        $canApply = $user && $this->userCanStartNewApplication($job, $user);

        return Inertia::render('students/Jobs/partials/[id]', [
            'job' => $this->serializeJobDetail($job, $hasApplied, false, null, $canApply),
        ]);
    }

    public function apply(Request $request, Job $job): RedirectResponse
    {
        $user = $request->user();

        if (! $job->is_published) {
            abort(404);
        }

        if ($job->applications()->where('user_id', $user->id)->exists()) {
            return back()->with('error', __('You have already applied to this job.'));
        }

        if (! $this->userEligibleAsApplicant($job, $user)) {
            abort(403);
        }

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'cover_letter' => ['required', 'string', 'max:10000'],
            'cv' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);

        $cvPath = $request->file('cv')->store('job-application-cvs', 'public');

        /** @var \App\Models\JobApplication $application */
        $application = $job->applications()->create([
            'user_id' => $user->id,
            'subject' => $validated['subject'],
            'cover_letter' => $validated['cover_letter'],
            'cv_path' => $cvPath,
            'status' => 'pending',
        ]);

        $job->load(['recruiters', 'creator']);
        $recipients = $job->recruiters;
        if ($recipients->isEmpty() && $job->creator) {
            $recipients = collect([$job->creator]);
        }

        $applicationsUrl = url('/recruiter/applications');
        $sentTo = [];
        foreach ($recipients as $recipient) {
            $email = strtolower(trim((string) ($recipient->email ?? '')));
            if ($email === '' || isset($sentTo[$email])) {
                continue;
            }
            $sentTo[$email] = true;
            Mail::to($recipient->email)->send(new NewJobApplicationMail($job, $application, $user, $applicationsUrl));
        }

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
    private function serializeJobDetail(Job $job, bool $hasApplied = false, bool $isManager = false, ?array $manage = null, bool $canApply = false): array
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
            'can_apply' => $canApply,
            'is_owner' => $isManager,
            'manage' => $manage,
        ];
    }

    private function userCanStartNewApplication(Job $job, \App\Models\User $user): bool
    {
        if ($job->applications()->where('user_id', $user->id)->exists()) {
            return false;
        }

        return $this->userEligibleAsApplicant($job, $user);
    }

    /**
     * Who may post an application: students/coworkers, staff who browse job pages, or recruiters not assigned to this job.
     * Blocks job creator and recruiters assigned to this posting.
     */
    private function userEligibleAsApplicant(Job $job, \App\Models\User $user): bool
    {
        $uid = (int) $user->id;
        if ($job->user_id !== null && (int) $job->user_id === $uid) {
            return false;
        }
        if ($job->recruiters()->where('users.id', $uid)->exists()) {
            return false;
        }

        $roles = $this->normalizedRoleStrings($user);
        $studentLike = ['student', 'coworker'];
        $staffWhoBrowseJobs = ['admin', 'coach', 'moderateur', 'studio_responsable', 'super_admin', 'responsable_studio'];

        if (array_intersect($roles, $studentLike) !== []) {
            return true;
        }
        if (array_intersect($roles, $staffWhoBrowseJobs) !== []) {
            return true;
        }
        if (in_array('recruiter', $roles, true)) {
            return true;
        }

        return false;
    }

    /**
     * @return list<string>
     */
    private function normalizedRoleStrings(\App\Models\User $user): array
    {
        $raw = $user->role;
        if ($raw === null || $raw === '') {
            return [];
        }
        if (! is_array($raw)) {
            $raw = [$raw];
        }
        $out = [];
        foreach ($raw as $r) {
            if ($r === null || $r === '') {
                continue;
            }
            $s = strtolower(trim((string) $r));
            if ($s !== '') {
                $out[] = $s;
            }
        }

        return array_values(array_unique($out));
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
