<?php

namespace App\Http\Controllers;

use App\Models\Job;
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
            ->openDeadline()
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

    public function show(Job $job): Response
    {
        if (! $job->is_published) {
            abort(404);
        }
        if ($job->deadline && $job->deadline->isBefore(now()->startOfDay())) {
            abort(404);
        }

        return Inertia::render('students/Jobs/partials/[id]', [
            'job' => $this->serializeJobDetail($job),
        ]);
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
            'deadline' => $job->deadline?->format('Y-m-d'),
            'created_at' => $job->created_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeJobDetail(Job $job): array
    {
        return [
            'id' => $job->id,
            'reference' => $job->reference,
            'title' => $job->title,
            'description' => $job->description,
            'location' => $job->location,
            'job_type' => $job->job_type,
            'skills' => $job->skills ?? [],
            'deadline' => $job->deadline?->format('Y-m-d'),
            'created_at' => $job->created_at->toIso8601String(),
        ];
    }

    private function distinctJobTypes(): Collection
    {
        return Job::query()
            ->published()
            ->openDeadline()
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
            ->openDeadline()
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
