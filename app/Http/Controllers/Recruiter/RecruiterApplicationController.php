<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $applications = JobApplication::query()
            ->whereHas('job', fn ($q) => $q->whereHas('recruiters', fn ($q2) => $q2->where('users.id', $userId)))
            ->with([
                'job:id,title,reference',
                'applicant:id,name,email,image',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (JobApplication $row) => [
                'id' => $row->id,
                'status' => $row->status,
                'cover_letter' => $row->cover_letter,
                'created_at' => $row->created_at?->toIso8601String(),
                'job' => $row->job ? [
                    'id' => $row->job->id,
                    'title' => $row->job->title,
                    'reference' => $row->job->reference,
                ] : null,
                'applicant' => $row->applicant ? [
                    'id' => $row->applicant->id,
                    'name' => $row->applicant->name,
                    'email' => $row->applicant->email,
                    'image' => $row->applicant->image,
                ] : null,
            ]);

        return Inertia::render('recruiter/applications/index', [
            'applications' => $applications,
        ]);
    }
}
