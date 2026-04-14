<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Mail\UserInvitedPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function inviteStudent(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['required', 'max:15'],
            'image' => ['required'],
        ]);
        $existing = User::query()->where('email', $data['email'])->first();
        if ($existing) {
            return response()->json([
                'status' => 'exists',
                'data' => $existing,
            ]);
        }
        $plainPassword = Str::random(12);
        $user = User::create([
            'id' => (string) Str::uuid(),
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($plainPassword),
            'phone' => $data['phone'],
            'image' => $data['image'],
            'status' => 'Studying',
            'cin' => null,
            'formation_id' => null,
            'remember_token' => null,
            'email_verified_at' => null,
        ]);
        Mail::to($user->email)->send(new UserInvitedPasswordMail($user, $plainPassword));

        return response()->json([
            'status' => 'created',
            'data' => $user,
        ]);
    }
}
