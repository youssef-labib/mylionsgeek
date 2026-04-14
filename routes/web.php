<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\GlobalAnalyticsController;
use App\Http\Controllers\API\SearchController as ApiSearchController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReservationsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        $roles = is_array($user->role) ? $user->role : [$user->role];
        $staffForAdminDashboard = array_intersect($roles, ['admin', 'moderateur', 'coach', 'studio_responsable']);
        if ($staffForAdminDashboard !== []) {
            return redirect()->route('dashboard');
        }
        if (in_array('student', $roles, true)) {
            return redirect()->route('student.feed');
        }
        if (in_array('recruiter', $roles, true)) {
            return redirect()->route('recruiter.dashboard');
        }

        return redirect()->route('profile.edit');
    }

    return Inertia::render('Welcome/index');
})->name('home');

// Protect admin dashboard
Route::middleware(['auth', 'verified', 'role:admin,moderateur,coach,studio_responsable'])->prefix('admin')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Global Analytics (admin)
    Route::get('analytics/global', [GlobalAnalyticsController::class, 'index'])->name('admin.analytics.global');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/reservations/check-availability', [ReservationsController::class, 'checkStudioAvailability'])->name('reservations.check-availability');
    Route::post('/reservations/available-equipment', [ReservationsController::class, 'availableEquipment'])->name('reservations.available-equipment');
    Route::post('/appointments/book', [ReservationsController::class, 'bookAppointment'])->name('appointments.book');
    Route::post('/access-requests', [ReservationsController::class, 'requestAccess'])->name('access-requests.create');

    Route::get('/api/search', [ApiSearchController::class, 'index']);

    // Notifications API - Get all notifications
    // Route::get('/api/notifications', function (Request $request) {
    //     $user = $request->user();
    //     if (!$user) {
    //         return response()->json(['notifications' => []]);
    //     }

    //     $notifications = [];

    //     try {
    //         $roles = is_array($user->role) ? $user->role : [$user->role];
    //         $isAdmin = in_array('admin', $roles);
    //         $isStudioResponsable = in_array('studio_responsable', $roles);
    //         $isCoach = in_array('coach', $roles);

    //         // 1. For studio_responsable: Show 5 last pending reservations
    //         if ($isStudioResponsable && \Schema::hasTable('reservations')) {
    //             $pendingReservations = \DB::table('reservations')
    //                 ->leftJoin('users', 'users.id', '=', 'reservations.user_id')
    //                 ->where('reservations.canceled', 0)
    //                 ->where('reservations.approved', 0)
    //                 ->select(
    //                     'reservations.id',
    //                     'reservations.title',
    //                     'reservations.day',
    //                     'reservations.start',
    //                     'reservations.end',
    //                     'reservations.type',
    //                     'reservations.created_at',
    //                     'users.name as sender_name',
    //                     'users.image as sender_image'
    //                 )
    //                 ->orderByDesc('reservations.created_at')
    //                 ->limit(5)
    //                 ->get();

    //             foreach ($pendingReservations as $reservation) {
    //                 $message = $reservation->title ?? "Reservation #{$reservation->id}";
    //                 if ($reservation->day && $reservation->start && $reservation->end) {
    //                     $message .= " - {$reservation->day} {$reservation->start}-{$reservation->end}";
    //                 }
    //                 if ($reservation->type) {
    //                     $message .= " ({$reservation->type})";
    //                 }

    //                 $notifications[] = [
    //                     'id' => 'reservation-' . $reservation->id,
    //                     'type' => 'reservation',
    //                     'sender_name' => $reservation->sender_name ?? 'Unknown',
    //                     'sender_image' => $reservation->sender_image,
    //                     'message' => $message,
    //                     'created_at' => $reservation->created_at,
    //                     'link' => '/admin/reservations/' . $reservation->id . '/details',
    //                     'icon_type' => 'calendar',
    //                 ];
    //             }
    //         }

    //         // 2. For admin: Show appointments made to them
    //         if ($isAdmin && \Schema::hasTable('appointments')) {
    //             // Get person email for current user (check if user email matches person_email in appointments)
    //             $userEmail = strtolower($user->email ?? '');

    //             if ($userEmail) {
    //                 $pendingAppointments = \DB::table('appointments as a')
    //                     ->leftJoin('users as u', 'u.id', '=', 'a.user_id')
    //                     ->whereRaw('LOWER(a.person_email) = ?', [$userEmail])
    //                     ->where('a.status', 'pending')
    //                     ->select(
    //                         'a.id',
    //                         'a.day',
    //                         'a.start',
    //                         'a.end',
    //                         'a.created_at',
    //                         'u.name as requester_name',
    //                         'u.image as requester_image'
    //                     )
    //                     ->orderByDesc('a.created_at')
    //                     ->limit(10)
    //                     ->get();

    //                 foreach ($pendingAppointments as $appointment) {
    //                     $message = "Appointment request";
    //                     if ($appointment->day && $appointment->start && $appointment->end) {
    //                         $message .= " - {$appointment->day} {$appointment->start}-{$appointment->end}";
    //                     }

    //                     $notifications[] = [
    //                         'id' => 'appointment-' . $appointment->id,
    //                         'type' => 'appointment',
    //                         'sender_name' => $appointment->requester_name ?? 'Unknown',
    //                         'sender_image' => $appointment->requester_image,
    //                         'message' => $message,
    //                         'created_at' => $appointment->created_at,
    //                         'link' => '/admin/appointments',
    //                         'icon_type' => 'calendar',
    //                     ];
    //                 }
    //             }
    //         }

    //         // Sort by created_at (newest first)
    //         usort($notifications, function ($a, $b) {
    //             return strtotime($b['created_at']) - strtotime($a['created_at']);
    //         });

    //         return response()->json(['notifications' => array_slice($notifications, 0, 50)]);
    //     } catch (\Exception $e) {
    //         \Log::error('Failed to fetch notifications: ' . $e->getMessage());
    //         return response()->json(['notifications' => []], 500);
    //     }
    // })->name('api.notifications');

    // Notifications API - Legacy endpoint for pending reservations
    Route::get('/api/notifications/pending-reservations', function (Request $request) {
        $user = $request->user();
        if (! $user) {
            return response()->json(['pending_reservations' => []]);
        }

        $roles = is_array($user->role) ? $user->role : [$user->role];
        $isAdmin = in_array('admin', $roles);
        $isStudioResponsable = in_array('studio_responsable', $roles);

        if (! $isAdmin && ! $isStudioResponsable) {
            return response()->json(['pending_reservations' => []]);
        }

        try {
            $pendingReservations = \DB::table('reservations')
                ->leftJoin('users', 'users.id', '=', 'reservations.user_id')
                ->leftJoin('studios', 'studios.id', '=', 'reservations.studio_id')
                ->where('reservations.canceled', 0)
                ->where('reservations.approved', 0)
                ->where('reservations.created_at', '>=', now()->subDays(7)) // Only last 7 days
                ->orderByDesc('reservations.created_at')
                ->limit(10)
                ->select(
                    'reservations.id',
                    'reservations.title',
                    'reservations.day',
                    'reservations.start',
                    'reservations.end',
                    'reservations.type',
                    'reservations.created_at',
                    'users.name as user_name',
                    'studios.name as studio_name'
                )
                ->get()
                ->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'title' => $r->title ?? "Reservation #{$r->id}",
                        'user_name' => $r->user_name ?? 'Unknown',
                        'studio_name' => $r->studio_name ?? 'N/A',
                        'type' => $r->type ?? 'N/A',
                        'date' => $r->day ?? 'N/A',
                        'time' => ($r->start && $r->end) ? "{$r->start} - {$r->end}" : 'N/A',
                        'created_at' => $r->created_at,
                    ];
                });

            return response()->json(['pending_reservations' => $pendingReservations]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch pending reservations: '.$e->getMessage());

            return response()->json(['pending_reservations' => []], 500);
        }
    })->name('api.notifications.pending-reservations');
});

// Public appointment approval/cancellation routes (no auth required - uses token)
Route::get('/appointments/{token}/approve', [ReservationsController::class, 'approveAppointment'])->name('appointments.approve');
Route::get('/appointments/{token}/cancel', [ReservationsController::class, 'cancelAppointment'])->name('appointments.cancel');
Route::get('/appointments/{token}/suggest', [ReservationsController::class, 'showAppointmentSuggestForm'])->name('appointments.suggest');
Route::post('/appointments/{token}/suggest', [ReservationsController::class, 'submitAppointmentSuggestForm'])->name('appointments.suggest.submit');
Route::get('/appointments/suggest/{token}/accept', [ReservationsController::class, 'acceptSuggestedTime'])->name('appointments.suggest.accept');

// Notifications API Routes
// These routes work for both web (auth middleware) and mobile API (auth:sanctum middleware)
// Using auth:sanctum which supports both web sessions and API tokens
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/api/notifications', [NotificationController::class, 'index'])->name('api.notifications');
    Route::post('/api/notifications/{type}/{id}/read', [NotificationController::class, 'markAsRead'])->name('api.notifications.mark-read');
    Route::post('/api/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('api.notifications.mark-all-read');
    Route::get('/api/notifications/ably-token', [NotificationController::class, 'getAblyToken'])->name('api.notifications.ably-token');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin/users.php';
require __DIR__.'/admin/computers.php';
require __DIR__.'/admin/leaderboard.php';
require __DIR__.'/admin/training.php';
require __DIR__.'/admin/courses.php';
require __DIR__.'/admin/exercices.php';
require __DIR__.'/admin/geeko.php';
require __DIR__.'/admin/equipment.php';
require __DIR__.'/admin/places.php';
require __DIR__.'/admin/reservations.php';
require __DIR__.'/admin/projects.php';
require __DIR__.'/admin/recruitment.php';
require __DIR__.'/admin/games.php';
require __DIR__.'/students/exercises.php';
require __DIR__.'/students/students.php';
require __DIR__.'/recruiter.php';
require __DIR__.'/studentProjects.php';
require __DIR__.'/admin/project-approvals.php';
require __DIR__.'/students/posts.php';
require __DIR__.'/chat.php';
