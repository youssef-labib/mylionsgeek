<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceListe;
use App\Models\Computer;
use App\Models\Equipment;
use App\Models\Project;
use App\Models\Reservation;
use App\Models\User;
use Inertia\Inertia;

class GlobalAnalyticsController extends Controller
{
    public function index()
    {
        $today = date('Y-m-d');

        // Reservations (latest)
        $latestReservations = Reservation::with(['user:id,name', 'studio:id,name'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'title', 'day', 'start', 'end', 'approved', 'canceled', 'user_id', 'studio_id', 'type', 'created_at'])
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'title' => $r->title,
                    'type' => $r->type,
                    'date' => $r->day,
                    'start' => $r->start,
                    'end' => $r->end,
                    'approved' => (bool) $r->approved,
                    'canceled' => (bool) $r->canceled,
                    'user_name' => $r->user->name ?? null,
                    'studio_name' => $r->studio->name ?? null,
                    'created_at' => $r->created_at?->toDateTimeString(),
                ];
            });

        // Computers with assignment
        $computers = Computer::with('user:id,name')
            ->get(['id', 'reference', 'state', 'user_id', 'mark'])
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'reference' => $c->reference,
                    'mark' => $c->mark,
                    'state' => $c->state,
                    'user_name' => $c->user->name ?? null,
                ];
            });

        // Equipment state + whether in today's reservation
        $equipment = Equipment::withCount(['reservations as in_reservation_today' => function ($q) use ($today) {
            $q->whereDate('reservations.day', '=', $today)->whereNull('reservations.canceled');
        }])
            ->get(['id', 'reference', 'mark', 'state'])
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'reference' => $e->reference,
                    'mark' => $e->mark,
                    'state' => (bool) $e->state,
                    'in_reservation_today' => $e->in_reservation_today > 0,
                ];
            });

        // Attendance: absences among attendance_lists created for today/week/month
        // Today: return detailed slots (who was absent morning/lunch/evening)
        $todayRows = AttendanceListe::whereDate('attendance_day', $today)
            ->whereRaw('(
                NULLIF(TRIM(morning), "") IS NULL
                AND NULLIF(TRIM(lunch), "") IS NULL
                AND NULLIF(TRIM(evening), "") IS NULL
            )')
            ->get(['user_id', 'attendance_day', 'morning', 'lunch', 'evening']);

        $absentToday = $todayRows->map(function ($row) {
            $u = User::find($row->user_id);

            return [
                'id' => $row->user_id,
                'name' => $u->name ?? ('User #'.$row->user_id),
                'email' => $u->email ?? null,
                'day' => $row->attendance_day,
                'absent_morning' => (int) (empty($row->morning)),
                'absent_lunch' => (int) (empty($row->lunch)),
                'absent_evening' => (int) (empty($row->evening)),
            ];
        })->filter(function ($r) {
            return ($r['absent_morning'] + $r['absent_lunch'] + $r['absent_evening']) > 0;
        })->values();

        // Week and Month ranges
        $startOfWeek = date('Y-m-d', strtotime('monday this week'));
        $endOfWeek = date('Y-m-d', strtotime('sunday this week'));
        $startOfMonth = date('Y-m-01');
        $endOfMonth = date('Y-m-t');

        $absentWeek = AttendanceListe::selectRaw('user_id,
                SUM(CASE WHEN (NULLIF(TRIM(morning), "") IS NULL AND NULLIF(TRIM(lunch), "") IS NULL AND NULLIF(TRIM(evening), "") IS NULL) THEN 1 ELSE 0 END) as absences,
                SUM(CASE WHEN NULLIF(TRIM(morning), "") IS NULL THEN 1 ELSE 0 END) as am,
                SUM(CASE WHEN NULLIF(TRIM(lunch), "") IS NULL THEN 1 ELSE 0 END) as noon,
                SUM(CASE WHEN NULLIF(TRIM(evening), "") IS NULL THEN 1 ELSE 0 END) as pm')
            ->whereBetween('attendance_day', [$startOfWeek, $endOfWeek])
            ->groupBy('user_id')
            ->orderByDesc('absences')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $u = User::find($row->user_id);

                return ['user_id' => $row->user_id, 'name' => $u->name ?? ('User #'.$row->user_id), 'absences' => (int) $row->absences, 'am' => (int) $row->am, 'noon' => (int) $row->noon, 'pm' => (int) $row->pm];
            });

        $absentMonth = AttendanceListe::selectRaw('user_id,
                SUM(CASE WHEN (NULLIF(TRIM(morning), "") IS NULL AND NULLIF(TRIM(lunch), "") IS NULL AND NULLIF(TRIM(evening), "") IS NULL) THEN 1 ELSE 0 END) as absences,
                SUM(CASE WHEN NULLIF(TRIM(morning), "") IS NULL THEN 1 ELSE 0 END) as am,
                SUM(CASE WHEN NULLIF(TRIM(lunch), "") IS NULL THEN 1 ELSE 0 END) as noon,
                SUM(CASE WHEN NULLIF(TRIM(evening), "") IS NULL THEN 1 ELSE 0 END) as pm')
            ->whereBetween('attendance_day', [$startOfMonth, $endOfMonth])
            ->groupBy('user_id')
            ->orderByDesc('absences')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                $u = User::find($row->user_id);

                return ['user_id' => $row->user_id, 'name' => $u->name ?? ('User #'.$row->user_id), 'absences' => (int) $row->absences, 'am' => (int) $row->am, 'noon' => (int) $row->noon, 'pm' => (int) $row->pm];
            });

        // Most absent overall
        $mostAbsent = AttendanceListe::selectRaw('user_id, SUM(CASE WHEN COALESCE(morning,0)+COALESCE(lunch,0)+COALESCE(evening,0)=0 THEN 1 ELSE 0 END) as absences')
            ->groupBy('user_id')
            ->orderByDesc('absences')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $u = User::find($row->user_id);

                return ['user_id' => $row->user_id, 'name' => $u->name ?? ('User #'.$row->user_id), 'absences' => (int) $row->absences];
            });

        // Newest projects
        $projects = Project::orderByDesc('created_at')->limit(8)->get(['id', 'name', 'created_at'])->map(function ($p) {
            return ['id' => $p->id, 'name' => $p->name, 'created_at' => $p->created_at?->toDateString()];
        });

        // Topline stats
        $totals = [
            'users' => User::count(),
            'reservations' => Reservation::count(),
            'computers' => Computer::count(),
            'equipment' => Equipment::count(),
            'projects' => Project::count(),
        ];

        return Inertia::render('admin/analytics/global', [
            'totals' => $totals,
            'latest_reservations' => $latestReservations,
            'computers' => $computers,
            'equipment' => $equipment,
            'absent_today' => $absentToday,
            'absent_week' => $absentWeek,
            'absent_month' => $absentMonth,
            'most_absent' => $mostAbsent,
            'projects_new' => $projects,
            'today' => $today,
        ]);
    }
}
