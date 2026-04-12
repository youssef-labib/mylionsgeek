<?php

namespace App\Http\Controllers\Recruiter;

use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\RecruiterInterview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $userId = $request->user()->id;

        $applicationsBase = JobApplication::query()
            ->whereHas('job', fn ($q) => $q->whereHas('recruiters', fn ($q2) => $q2->where('users.id', $userId)));

        $totalApplications = (clone $applicationsBase)->count();

        $byStatus = (clone $applicationsBase)
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->all();

        $thisMonth = (clone $applicationsBase)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $lastMonth = (clone $applicationsBase)
            ->whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])
            ->count();

        $interviewsUpcoming = RecruiterInterview::query()
            ->where('user_id', $userId)
            ->where('starts_at', '>=', now()->startOfDay())
            ->orderBy('starts_at')
            ->limit(8)
            ->get()
            ->map(fn (RecruiterInterview $row) => [
                'id' => $row->id,
                'title' => $row->title,
                'starts_at' => $row->starts_at->toIso8601String(),
                'ends_at' => $row->ends_at?->toIso8601String(),
                'group_label' => $row->group_label,
            ]);

        $interviewsThisWeek = RecruiterInterview::query()
            ->where('user_id', $userId)
            ->whereBetween('starts_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();

        return Inertia::render('recruiter/dashboard/index', [
            'stats' => [
                'total_applications' => $totalApplications,
                'by_status' => $byStatus,
                'applications_this_month' => $thisMonth,
                'applications_last_month' => $lastMonth,
                'interviews_this_week' => $interviewsThisWeek,
            ],
            'upcomingInterviews' => $interviewsUpcoming,
        ]);
    }
}
