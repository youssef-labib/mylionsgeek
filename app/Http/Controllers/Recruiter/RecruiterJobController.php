<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterJobController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $jobs = Job::query()
            ->whereHas('recruiters', fn ($q) => $q->where('users.id', $userId))
            ->withCount('applications')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Job $job) => [
                'id' => $job->id,
                'reference' => $job->reference,
                'title' => $job->title,
                'job_type' => $job->job_type,
                'location' => $job->location,
                'is_published' => (bool) $job->is_published,
                'skills' => $job->skills ?? [],
                'applications_count' => $job->applications_count,
                'created_at' => $job->created_at?->toIso8601String(),
            ]);

        return Inertia::render('recruiter/jobs/index', [
            'jobs' => $jobs,
        ]);
    }
}
