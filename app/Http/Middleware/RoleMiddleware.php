<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (! $user) {
            return redirect('/'); // or login page
        }

        // Handle pipe or comma separated roles
        if (count($roles) === 1 && (str_contains($roles[0], '|') || str_contains($roles[0], ','))) {
            $roles = preg_split('/[|,]/', $roles[0]);
        }

        $allowedRoles = array_map('trim', $roles);

        // Ensure roles are an array
        $userRoles = is_array($user->role) ? $user->role : [$user->role];

        // Check if user has at least one allowed role
        $hasAccess = ! empty(array_intersect($allowedRoles, $userRoles));

        if (! $hasAccess) {
            if (in_array('student', $userRoles)) {
                return redirect()->route('student.feed');
            }
            if (in_array('admin', $userRoles)) {
                return redirect()->route('dashboard');
            }
            if (in_array('recruiter', $userRoles)) {
                return redirect()->route('recruiter.jobs.index');
            }

            return redirect()->route('profile.edit');
        }

        return $next($request);
    }
}
