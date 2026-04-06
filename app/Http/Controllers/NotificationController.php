<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\DisciplineNotification;
use App\Models\ExerciseReviewNotification;
use App\Models\PostNotification;
use App\Models\FollowNotification;
use App\Models\ProjectSubmissionNotification;
use App\Models\ProjectStatusNotification;
use App\Models\AccessRequestNotification;
use App\Models\AccessRequestResponseNotification;
use App\Models\TaskAssignmentNotification;
use App\Models\ProjectMessageNotification;
use App\Models\Formation;
use App\Models\User;
use Ably\AblyRest;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['notifications' => []]);
        }

        $notifications = [];

        try {
            $roles = is_array($user->role) ? $user->role : [$user->role];
            $isAdmin = in_array('admin', $roles);
            $isModerator = in_array('moderateur', $roles);
            $isStudioResponsable = in_array('studio_responsable', $roles);
            $isCoach = in_array('coach', $roles);

            //  1. DISCIPLINE CHANGE NOTIFICATIONS (Admin, Moderator, Coach)
            // Using new DisciplineNotification model
            if ($isAdmin || $isModerator) {
                // Admins/Moderators get ALL discipline notifications
                $disciplineNotifications = DisciplineNotification::with('user')
                    ->orderByDesc('created_at')
                    ->limit(20)
                    ->get();

                foreach ($disciplineNotifications as $notif) {
                    // Skip notifications for users with status == "left"
                    if ($notif->user && strtolower($notif->user->status ?? '') === 'left') {
                        continue;
                    }

                    $notifications[] = [
                        'id' => 'discipline-' . $notif->id,
                        'type' => 'discipline_change',
                        'sender_name' => $notif->user->name ?? 'Unknown',
                        'sender_image' => $notif->user->image ?? null,
                        'message' => $notif->message_notification ?? '',
                        'link' => $notif->path ?? "/admin/users/{$notif->user_id}",
                        'icon_type' => 'user',
                        'discipline_value' => $notif->discipline_change,
                        'change_type' => $notif->type, // 'increase' or 'decrease'
                        'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                        'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                    ];
                }
            } elseif ($isCoach) {
                // Coaches get only their students' discipline notifications
                $coachFormations = Formation::where('user_id', $user->id)->pluck('id');
                $studentIds = User::whereIn('formation_id', $coachFormations)->pluck('id');

                $disciplineNotifications = DisciplineNotification::with('user')
                    ->whereIn('user_id', $studentIds)
                    ->orderByDesc('created_at')
                    ->limit(20)
                    ->get();

                foreach ($disciplineNotifications as $notif) {
                    // Skip notifications for users with status == "left"
                    if ($notif->user && strtolower($notif->user->status ?? '') === 'left') {
                        continue;
                    }

                    $notifications[] = [
                        'id' => 'discipline-' . $notif->id,
                        'type' => 'discipline_change',
                        'sender_name' => $notif->user->name ?? 'Unknown',
                        'sender_image' => $notif->user->image ?? null,
                        'message' => $notif->message_notification ?? '',
                        'link' => $notif->path ?? "/admin/users/{$notif->user_id}",
                        'icon_type' => 'user',
                        'discipline_value' => $notif->discipline_change,
                        'change_type' => $notif->type,
                        'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                        'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                    ];
                }
            }

            // Exercise Review Notifications (Coach) - Show for all coaches regardless of other roles
            if ($isCoach) {
                try {
                    $exerciseReviewNotifications = ExerciseReviewNotification::with(['user', 'exercice.training'])
                        ->where('coach_id', $user->id)
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->get();

                    Log::info('Exercise review notifications query', [
                        'coach_id' => $user->id,
                        'found_count' => $exerciseReviewNotifications->count()
                    ]);

                    foreach ($exerciseReviewNotifications as $notif) {
                        // Only add if user relationship exists
                        if ($notif->user) {
                            // Get training_id from exercice if path doesn't have it
                            $link = $notif->path;
                            if (!$link || $link === "/admin/exercices" || $link === "/trainings") {
                                // Get training_id from exercice
                                $trainingId = null;
                                if ($notif->exercice) {
                                    $trainingId = $notif->exercice->training_id ?? ($notif->exercice->training->id ?? null);
                                }
                                if ($trainingId) {
                                    $link = "/trainings/{$trainingId}";
                                } else {
                                    $link = "/trainings";
                                }
                            }
                            
                            $notifications[] = [
                                'id' => 'exercise-review-' . $notif->id,
                                'type' => 'exercise_review',
                                'sender_name' => $notif->user->name ?? 'Unknown',
                                'sender_image' => $notif->user->image ?? null,
                                'message' => $notif->message_notification ?? 'Student asked you to review his exercise',
                                'link' => $link,
                                'icon_type' => 'file-text',
                                'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                                'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error fetching exercise review notifications: ' . $e->getMessage());
                }
            }

            //  1.5. PROJECT SUBMISSION NOTIFICATIONS (Admin and Coach)
            if (($isAdmin || $isModerator || $isCoach) && Schema::hasTable('project_submission_notifications')) {
                try {
                    $projectNotifications = ProjectSubmissionNotification::with(['student', 'project'])
                        ->where('notified_user_id', $user->id)
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->get();

                    foreach ($projectNotifications as $notif) {
                        if ($notif->student && $notif->project) {
                            $link = $notif->path ?? "/students/project/{$notif->project_id}";
                            
                            $notifications[] = [
                                'id' => 'project-submission-' . $notif->id,
                                'type' => 'project_submission',
                                'sender_name' => $notif->student->name ?? 'Unknown',
                                'sender_image' => $notif->student->image ?? null,
                                'message' => $notif->message_notification ?? 'A student submitted a new project',
                                'link' => $link,
                                'icon_type' => 'folder',
                                'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                                'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error fetching project submission notifications: ' . $e->getMessage());
                }
            }

            //  1.6. ACCESS REQUEST NOTIFICATIONS (Admin only)
            if ($isAdmin && Schema::hasTable('access_request_notifications')) {
                try {
                    $accessRequests = AccessRequestNotification::with('user')
                        ->where('status', 'pending')
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->get();

                    foreach ($accessRequests as $notif) {
                        if ($notif->user) {
                            $accessTypeLabel = match($notif->requested_access_type) {
                                'studio' => 'Studio',
                                'cowork' => 'Cowork',
                                'both' => 'Studio & Cowork',
                                default => 'Access'
                            };
                            
                            $notifications[] = [
                                'id' => 'access-request-' . $notif->id,
                                'type' => 'access_request',
                                'sender_name' => $notif->user->name ?? 'Unknown',
                                'sender_image' => $notif->user->image ?? null,
                                'message' => $notif->message ?? "{$notif->user->name} requested {$accessTypeLabel} access",
                                'link' => "/admin/users/{$notif->user_id}",
                                'icon_type' => 'lock',
                                'access_type' => $notif->requested_access_type,
                                'notification_id' => $notif->id,
                                'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                                'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error fetching access request notifications: ' . $e->getMessage());
                }
            }

            //  2. PENDING RESERVATIONS (Studio Responsable)
            if ($isStudioResponsable && Schema::hasTable('reservations')) {
                $pendingReservations = DB::table('reservations')
                    ->leftJoin('users', 'users.id', '=', 'reservations.user_id')
                    ->where('reservations.canceled', 0)
                    ->where('reservations.approved', 0)
                    ->select(
                        'reservations.id',
                        'reservations.title',
                        'reservations.day',
                        'reservations.start',
                        'reservations.end',
                        'reservations.type',
                        'reservations.created_at',
                        'users.name as sender_name',
                        'users.image as sender_image'
                    )
                    ->orderByDesc('reservations.created_at')
                    ->limit(5)
                    ->get();

                foreach ($pendingReservations as $reservation) {
                    $message = $reservation->title ?? "Reservation #{$reservation->id}";
                    if ($reservation->day && $reservation->start && $reservation->end) {
                        $message .= " - {$reservation->day} {$reservation->start}-{$reservation->end}";
                    }
                    if ($reservation->type) {
                        $message .= " ({$reservation->type})";
                    }

                    $notifications[] = [
                        'id' => 'reservation-' . $reservation->id,
                        'type' => 'reservation',
                        'sender_name' => $reservation->sender_name ?? 'Unknown',
                        'sender_image' => $reservation->sender_image,
                        'message' => $message,
                        'created_at' => $reservation->created_at,
                        'link' => '/admin/reservations/' . $reservation->id . '/details',
                        'icon_type' => 'calendar',
                    ];
                }
            }

            //  3. APPOINTMENTS (Admin)
            if ($isAdmin && Schema::hasTable('appointments')) {
                $userEmail = strtolower($user->email ?? '');
                if ($userEmail) {
                    $pendingAppointments = DB::table('appointments as a')
                        ->leftJoin('users as u', 'u.id', '=', 'a.user_id')
                        ->whereRaw('LOWER(a.person_email) = ?', [$userEmail])
                        ->where('a.status', 'pending')
                        ->select(
                            'a.id',
                            'a.day',
                            'a.start',
                            'a.end',
                            'a.created_at',
                            'u.name as requester_name',
                            'u.image as requester_image'
                        )
                        ->orderByDesc('a.created_at')
                        ->limit(10)
                        ->get();

                    foreach ($pendingAppointments as $appointment) {
                        $message = "Appointment request";
                        if ($appointment->day && $appointment->start && $appointment->end) {
                            $message .= " - {$appointment->day} {$appointment->start}-{$appointment->end}";
                        }

                        $notifications[] = [
                            'id' => 'appointment-' . $appointment->id,
                            'type' => 'appointment',
                            'sender_name' => $appointment->requester_name ?? 'Unknown',
                            'sender_image' => $appointment->requester_image,
                            'message' => $message,
                            'created_at' => $appointment->created_at,
                            'link' => '/admin/appointments',
                            'icon_type' => 'calendar',
                        ];
                    }
                }
            }

            // 3.5. ACCESS REQUEST RESPONSE NOTIFICATIONS (Users who requested access)
            if (Schema::hasTable('access_request_response_notifications')) {
                try {
                    $accessResponseNotifications = AccessRequestResponseNotification::with(['reviewer', 'accessRequest'])
                        ->where('user_id', $user->id)
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->get();

                    foreach ($accessResponseNotifications as $notif) {
                        $reviewerName = $notif->reviewer ? $notif->reviewer->name : 'Admin';
                        $message = $notif->message_notification;
                        
                        // Add denial reason to message if denied
                        if ($notif->status === 'denied' && $notif->denial_reason) {
                            $message .= ' Reason: ' . $notif->denial_reason;
                        }

                        $notifications[] = [
                            'id' => 'access-request-response-' . $notif->id,
                            'type' => 'access_request_response',
                            'sender_name' => $reviewerName,
                            'sender_image' => $notif->reviewer ? $notif->reviewer->image : null,
                            'message' => $message,
                            'link' => $notif->path ?? '/student/spaces',
                            'icon_type' => $notif->status === 'approved' ? 'check-circle' : 'x-circle',
                            'status' => $notif->status,
                            'denial_reason' => $notif->denial_reason,
                            'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                            'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                        ];
                    }
                } catch (\Exception $e) {
                    Log::error('Error fetching access request response notifications: ' . $e->getMessage());
                }
            }

            // 4. POST NOTIFICATIONS (All users)
            $postNotifications = PostNotification::with(['sender', 'post'])
                ->where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get();

            foreach ($postNotifications as $notif) {
                $senderName = $notif->sender ? $notif->sender->name : 'Unknown';
                $senderImage = $notif->sender ? $notif->sender->image : null;
                
                if ($notif->type === 'like') {
                    $message = "{$senderName} liked your post";
                } elseif ($notif->type === 'comment') {
                    $message = "{$senderName} commented on your post";
                } elseif ($notif->type === 'comment_like') {
                    $message = "{$senderName} liked your comment";
                } elseif ($notif->type === 'mention') {
                    $message = "{$senderName} mentioned you in a post";
                } else {
                    $message = "{$senderName} interacted with your post";
                }

                $notifications[] = [
                    'id' => 'post-' . $notif->id,
                    'type' => 'post_interaction',
                    'sender_name' => $senderName,
                    'sender_image' => $senderImage,
                    'message' => $message,
                    'link' => '/students/feed#post-' . $notif->post_id,
                    'icon_type' => 'user',
                    'created_at' => $notif->created_at->toISOString(),
                    'read_at' => $notif->read_at ? $notif->read_at->toISOString() : null,
                ];
            }

            // 5. FOLLOW NOTIFICATIONS (All users)
            $followNotifications = FollowNotification::with('follower')
                ->where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get();

            foreach ($followNotifications as $notif) {
                $senderName = $notif->follower ? $notif->follower->name : 'Unknown';
                $senderImage = $notif->follower ? $notif->follower->image : null;
                
                $notifications[] = [
                    'id' => 'follow-' . $notif->id,
                    'type' => 'follow',
                    'sender_name' => $senderName,
                    'sender_image' => $senderImage,
                    'message' => "{$senderName} started following you",
                    'link' => "/students/{$notif->follower_id}",
                    'icon_type' => 'user',
                    'created_at' => $notif->created_at->toISOString(),
                    'read_at' => $notif->read_at ? $notif->read_at->toISOString() : null,
                    'follower_id' => $notif->follower_id,
                ];
            }

            // 6. PROJECT STATUS NOTIFICATIONS (Students - when project is approved/rejected)
            if (Schema::hasTable('project_status_notifications')) {
                try {
                    $projectStatusNotifications = ProjectStatusNotification::with(['project', 'reviewer'])
                        ->where('student_id', $user->id)
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->get();

                    foreach ($projectStatusNotifications as $notif) {
                        if ($notif->project) {
                            $link = $notif->path ?? "/students/project/{$notif->project_id}";
                            $reviewerName = $notif->reviewer ? $notif->reviewer->name : 'Admin';
                            
                            $iconType = $notif->status === 'approved' ? 'check-circle' : 'x-circle';
                            
                            $notifications[] = [
                                'id' => 'project-status-' . $notif->id,
                                'type' => 'project_status',
                                'sender_name' => $reviewerName,
                                'sender_image' => $notif->reviewer ? $notif->reviewer->image : null,
                                'message' => $notif->message_notification,
                                'link' => $link,
                                'icon_type' => $iconType,
                                'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                                'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                                'status' => $notif->status,
                                'rejection_reason' => $notif->rejection_reason,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error fetching project status notifications: ' . $e->getMessage());
                }
            }

            // 7. TASK ASSIGNMENT NOTIFICATIONS (Users assigned to tasks)
            if (Schema::hasTable('task_assignment_notifications')) {
                try {
                    $taskAssignmentNotifications = TaskAssignmentNotification::with(['task', 'assignedByUser'])
                        ->where('assigned_to_user_id', $user->id)
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->get();

                    foreach ($taskAssignmentNotifications as $notif) {
                        if ($notif->assignedByUser) {
                            $link = $notif->path ?? "/admin/projects";
                            
                            $notifications[] = [
                                'id' => 'task-assignment-' . $notif->id,
                                'type' => 'task_assignment',
                                'sender_name' => $notif->assignedByUser->name ?? 'Unknown',
                                'sender_image' => $notif->assignedByUser->image ?? null,
                                'message' => $notif->message_notification,
                                'link' => $link,
                                'icon_type' => 'briefcase',
                                'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                                'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error fetching task assignment notifications: ' . $e->getMessage());
                }
            }

            // 8. PROJECT MESSAGE NOTIFICATIONS (Users who receive project chat messages)
            if (Schema::hasTable('project_message_notifications')) {
                try {
                    $projectMessageNotifications = ProjectMessageNotification::with(['sender', 'project'])
                        ->where('notified_user_id', $user->id)
                        ->orderByDesc('created_at')
                        ->limit(20)
                        ->get();

                    foreach ($projectMessageNotifications as $notif) {
                        if ($notif->sender && $notif->project) {
                            $link = $notif->path ?? "/admin/projects/{$notif->project_id}";
                            
                            $notifications[] = [
                                'id' => 'project-message-' . $notif->id,
                                'type' => 'project_message',
                                'sender_name' => $notif->sender->name ?? 'Unknown',
                                'sender_image' => $notif->sender->image ?? null,
                                'message' => $notif->message_notification,
                                'link' => $link,
                                'icon_type' => 'message-square',
                                'created_at' => $notif->created_at->format('Y-m-d H:i:s'),
                                'read_at' => $notif->read_at ? $notif->read_at->format('Y-m-d H:i:s') : null,
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error fetching project message notifications: ' . $e->getMessage());
                }
            }

            // Sort by created_at (newest first)
            usort($notifications, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json(['notifications' => array_slice($notifications, 0, 50)]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch notifications: ' . $e->getMessage());
            return response()->json(['notifications' => []], 500);
        }
    }

    /**
     * Mark a specific notification as read
     */
    public function markAsRead(Request $request, $type, $id)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            switch ($type) {
                case 'follow':
                    $notification = FollowNotification::where('id', $id)
                        ->where('user_id', $user->id)
                        ->first();
                    if ($notification) {
                        $notification->read_at = now();
                        $notification->save();
                    }
                    break;
                case 'post':
                    $notification = PostNotification::where('id', $id)
                        ->where('user_id', $user->id)
                        ->first();
                    if ($notification) {
                        $notification->read_at = now();
                        $notification->save();
                    }
                    break;
                case 'exercise-review':
                    $notification = ExerciseReviewNotification::where('id', $id)
                        ->where('coach_id', $user->id)
                        ->first();
                    if ($notification) {
                        $notification->read_at = now();
                        $notification->save();
                    }
                    break;
                case 'project-submission':
                    if (Schema::hasTable('project_submission_notifications')) {
                        $notification = ProjectSubmissionNotification::where('id', $id)
                            ->where('notified_user_id', $user->id)
                            ->first();
                        if ($notification) {
                            $notification->read_at = now();
                            $notification->save();
                        }
                    }
                    break;
                case 'project-status':
                    if (Schema::hasTable('project_status_notifications')) {
                        $notification = ProjectStatusNotification::where('id', $id)
                            ->where('student_id', $user->id)
                            ->first();
                        if ($notification) {
                            $notification->read_at = now();
                            $notification->save();
                        }
                    }
                    break;
                case 'access_request':
                    $roles = is_array($user->role) ? $user->role : [$user->role];
                    $isAdmin = in_array('admin', $roles);
                    if ($isAdmin && Schema::hasTable('access_request_notifications')) {
                        $notification = AccessRequestNotification::where('id', $id)->first();
                        if ($notification) {
                            $notification->read_at = now();
                            $notification->save();
                        }
                    }
                    break;
                case 'access_request_response':
                    if (Schema::hasTable('access_request_response_notifications')) {
                        $notification = AccessRequestResponseNotification::where('id', $id)
                            ->where('user_id', $user->id)
                            ->first();
                        if ($notification) {
                            $notification->read_at = now();
                            $notification->save();
                        }
                    }
                    break;
                case 'discipline_change':
                    $roles = is_array($user->role) ? $user->role : [$user->role];
                    $isAdmin = in_array('admin', $roles);
                    $isModerator = in_array('moderateur', $roles);
                    $isCoach = in_array('coach', $roles);
                    
                    $query = DisciplineNotification::where('id', $id);
                    
                    if ($isAdmin || $isModerator) {
                        // Admins/Moderators can mark any discipline notification as read
                        $notification = $query->first();
                    } elseif ($isCoach) {
                        // Coaches can only mark discipline notifications for their students
                        $coachFormations = Formation::where('user_id', $user->id)->pluck('id');
                        $studentIds = User::whereIn('formation_id', $coachFormations)->pluck('id');
                        $notification = $query->whereIn('user_id', $studentIds)->first();
                    } else {
                        // Regular users can mark their own discipline notifications
                        $notification = $query->where('user_id', $user->id)->first();
                    }
                    
                    if ($notification) {
                        $notification->read_at = now();
                        $notification->save();
                    }
                    break;
                case 'task-assignment':
                case 'task_assignment':
                    if (Schema::hasTable('task_assignment_notifications')) {
                        $notification = TaskAssignmentNotification::where('id', $id)
                            ->where('assigned_to_user_id', $user->id)
                            ->first();
                        if ($notification) {
                            $notification->read_at = now();
                            $notification->save();
                        }
                    }
                    break;
                case 'project-message':
                case 'project_message':
                    if (Schema::hasTable('project_message_notifications')) {
                        $notification = ProjectMessageNotification::where('id', $id)
                            ->where('notified_user_id', $user->id)
                            ->first();
                        if ($notification) {
                            $notification->read_at = now();
                            $notification->save();
                        }
                    }
                    break;
                default:
                    return response()->json(['error' => 'Invalid notification type'], 400);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark as read'], 500);
        }
    }

    /**
     * Mark all notifications as read for the authenticated user
     */
    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            // Mark all follow notifications as read
            FollowNotification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            // Mark all post notifications as read
            PostNotification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            // Mark all exercise review notifications as read (for coaches)
            ExerciseReviewNotification::where('coach_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            // Mark all project submission notifications as read (for admins/coaches)
            if (Schema::hasTable('project_submission_notifications')) {
                ProjectSubmissionNotification::where('notified_user_id', $user->id)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            // Mark all project status notifications as read (for students)
            if (Schema::hasTable('project_status_notifications')) {
                ProjectStatusNotification::where('student_id', $user->id)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            // Mark all task assignment notifications as read (for users)
            if (Schema::hasTable('task_assignment_notifications')) {
                TaskAssignmentNotification::where('assigned_to_user_id', $user->id)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            // Mark all project message notifications as read (for users)
            if (Schema::hasTable('project_message_notifications')) {
                ProjectMessageNotification::where('notified_user_id', $user->id)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            // Mark all access request response notifications as read (for users)
            if (Schema::hasTable('access_request_response_notifications')) {
                AccessRequestResponseNotification::where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            // Don't auto-mark access request notifications as read - they should only be marked when action is taken
            // Access request notifications will be marked as read individually when approve/deny actions are performed

            // Mark all discipline notifications as read
            $roles = is_array($user->role) ? $user->role : [$user->role];
            $isAdmin = in_array('admin', $roles);
            $isModerator = in_array('moderateur', $roles);
            $isCoach = in_array('coach', $roles);
            
            if ($isAdmin || $isModerator) {
                // Admins/Moderators mark all discipline notifications as read
                DisciplineNotification::whereNull('read_at')
                    ->update(['read_at' => now()]);
            } elseif ($isCoach) {
                // Coaches mark discipline notifications for their students as read
                $coachFormations = Formation::where('user_id', $user->id)->pluck('id');
                $studentIds = User::whereIn('formation_id', $coachFormations)->pluck('id');
                DisciplineNotification::whereIn('user_id', $studentIds)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            } else {
                // Regular users mark their own discipline notifications as read
                DisciplineNotification::where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to mark all as read'], 500);
        }
    }

    /**
     * Get Ably token for real-time notifications
     */
    public function getAblyToken(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $ablyKey = config('services.ably.key');
            if (!$ablyKey) {
                return response()->json(['error' => 'Ably not configured'], 500);
            }

            // Generate token request for notifications channel
            $tokenRequest = [
                'capability' => json_encode([
                    "notifications:{$user->id}" => ['subscribe'], // Only subscribe to own notifications
                ]),
                'clientId' => (string) $user->id,
            ];

            // Use Ably REST client to create token request
            $ably = new AblyRest($ablyKey);
            $tokenDetails = $ably->auth->requestToken($tokenRequest);

            return response()->json([
                'token' => $tokenDetails->token,
                'channelName' => "notifications:{$user->id}",
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate Ably token for notifications: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate token'], 500);
        }
    }
}

