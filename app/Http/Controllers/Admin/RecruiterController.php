<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\UserInvitedPasswordMail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RecruiterController extends Controller
{
    public function index(): Response
    {
        $recruiters = User::query()
            ->whereJsonContains('role', 'recruiter')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'image' => $user->image,
                'status' => $user->status,
                'role' => $user->role,
                'account_state' => (int) $user->account_state,
                'created_at' => $user->created_at?->toIso8601String(),
                'last_online' => $user->last_online,
            ]);

        return Inertia::render('admin/recruiters/index', [
            'recruiters' => $recruiters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
        ]);

        $plainPassword = Str::password(14);

        $lastUser = User::query()->orderByDesc('id')->first();
        $nextId = $lastUser ? ((int) $lastUser->id) + 1 : 1;

        $user = User::create([
            'id' => $nextId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $plainPassword,
            'phone' => null,
            'image' => 'pdp.png',
            'status' => 'Working',
            'cin' => null,
            'formation_id' => null,
            'account_state' => 1,
            'access_studio' => 0,
            'access_cowork' => 0,
            'role' => ['recruiter'],
            'email_verified_at' => now(),
            'activation_token' => null,
        ]);

        Mail::to($user->email)->send(new UserInvitedPasswordMail($user, $plainPassword));

        return redirect()->back()->with('success', 'Recruiter invited. Login details were sent by email.');
    }
}
