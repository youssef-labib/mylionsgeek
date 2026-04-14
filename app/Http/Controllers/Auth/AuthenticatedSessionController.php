<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request)
    {

        // $user = User::active()->where('email', $request->email)->first();

        // if (!$user) {
        //     throw ValidationException::withMessages([
        //         'email' => 'This account has been deactivated.',
        //     ]);
        // }
        $request->authenticate();
        $user = Auth::user();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // account_state: 1 = active, 0 = suspended (matches admin Members table). Null treated as active for legacy rows.
        $isSuspended = $user->account_state !== null && (int) $user->account_state === 0;
        if ($isSuspended) {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'email' => 'Your account has been suspended. Please contact administration.',
            ]);
        }

        $request->session()->regenerate();
        $user->forceFill([
            'last_online' => now(),
        ])->save();

        $roles = is_array($user->role) ? $user->role : [$user->role];

        if (in_array('student', $roles, true)) {
            return Inertia::location('/students/feed');
        }

        if (in_array('recruiter', $roles, true)) {
            return Inertia::location('/recruiter/jobs');
        }

        return Inertia::location('/admin/dashboard');

    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
