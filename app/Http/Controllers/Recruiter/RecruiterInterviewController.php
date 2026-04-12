<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\RecruiterInterview;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterInterviewController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $interviews = RecruiterInterview::query()
            ->where('user_id', $userId)
            ->with(['jobApplication.job:id,title,reference', 'jobApplication.applicant:id,name'])
            ->orderBy('starts_at')
            ->get()
            ->map(fn (RecruiterInterview $row) => [
                'id' => $row->id,
                'title' => $row->title,
                'group_label' => $row->group_label,
                'starts_at' => $row->starts_at->toIso8601String(),
                'ends_at' => $row->ends_at?->toIso8601String(),
                'notes' => $row->notes,
                'job_application_id' => $row->job_application_id,
                'application' => $row->jobApplication ? [
                    'id' => $row->jobApplication->id,
                    'job_title' => $row->jobApplication->job?->title,
                    'applicant_name' => $row->jobApplication->applicant?->name,
                ] : null,
            ]);

        $applicationOptions = JobApplication::query()
            ->whereHas('job', fn ($q) => $q->whereHas('recruiters', fn ($q2) => $q2->where('users.id', $userId)))
            ->with(['job:id,title', 'applicant:id,name'])
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(fn (JobApplication $app) => [
                'id' => $app->id,
                'label' => ($app->job?->title ?? 'Job').' — '.($app->applicant?->name ?? 'Applicant'),
            ]);

        return Inertia::render('recruiter/interviews/index', [
            'interviews' => $interviews,
            'applicationOptions' => $applicationOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'group_label' => ['nullable', 'string', 'max:120'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'job_application_id' => [
                'nullable',
                'integer',
                Rule::exists('job_applications', 'id')->where(function ($q) use ($userId) {
                    $q->whereHas('job', fn ($j) => $j->whereHas('recruiters', fn ($r) => $r->where('users.id', $userId)));
                }),
            ],
        ]);

        $starts = Carbon::parse($validated['starts_at']);
        $ends = isset($validated['ends_at'])
            ? Carbon::parse($validated['ends_at'])
            : $starts->copy()->addMinutes(30);

        RecruiterInterview::create([
            'user_id' => $userId,
            'job_application_id' => $validated['job_application_id'] ?? null,
            'group_label' => $validated['group_label'] ?? null,
            'title' => $validated['title'],
            'starts_at' => $starts,
            'ends_at' => $ends,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', __('Interview scheduled.'));
    }

    public function update(Request $request, RecruiterInterview $recruiterInterview): RedirectResponse
    {
        $this->authorizeInterview($request, $recruiterInterview);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'group_label' => ['nullable', 'string', 'max:120'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'job_application_id' => [
                'nullable',
                'integer',
                Rule::exists('job_applications', 'id')->where(function ($q) use ($request) {
                    $userId = $request->user()->id;
                    $q->whereHas('job', fn ($j) => $j->whereHas('recruiters', fn ($r) => $r->where('users.id', $userId)));
                }),
            ],
        ]);

        $starts = Carbon::parse($validated['starts_at']);
        $ends = isset($validated['ends_at'])
            ? Carbon::parse($validated['ends_at'])
            : $starts->copy()->addMinutes(30);

        $recruiterInterview->update([
            'job_application_id' => $validated['job_application_id'] ?? null,
            'group_label' => $validated['group_label'] ?? null,
            'title' => $validated['title'],
            'starts_at' => $starts,
            'ends_at' => $ends,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', __('Interview updated.'));
    }

    public function destroy(Request $request, RecruiterInterview $recruiterInterview): RedirectResponse
    {
        $this->authorizeInterview($request, $recruiterInterview);
        $recruiterInterview->delete();

        return back()->with('success', __('Interview removed.'));
    }

    private function authorizeInterview(Request $request, RecruiterInterview $interview): void
    {
        if ((int) $interview->user_id !== (int) $request->user()->id) {
            abort(403);
        }
    }
}
