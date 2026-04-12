<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Handle roles - ensure it's always an array
        $roles = [];
        if (isset($user->role)) {
            $roles = is_array($user->role) ? $user->role : (is_string($user->role) ? json_decode($user->role, true) ?? [$user->role] : [$user->role]);
        }
        if (empty($roles) && isset($user->roles)) {
            $roles = is_array($user->roles) ? $user->roles : (is_string($user->roles) ? json_decode($user->roles, true) ?? [] : []);
        }

        // Check if user is admin
        $isAdmin = in_array('admin', array_map('strtolower', $roles)) || in_array('coach', array_map('strtolower', $roles));

        // Base user data (always returned)
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->image ? url('storage/'.$user->image) : null,
            'image' => $user->image ?? null,
            'roles' => $roles,
            'role' => $roles,
            'promo' => $user->promo ?? null,
            'status' => $user->status ?? null,
            'created_at' => $user->created_at ? (is_string($user->created_at) ? $user->created_at : $user->created_at->toDateTimeString()) : null,
            'updated_at' => $user->updated_at ? (is_string($user->updated_at) ? $user->updated_at : $user->updated_at->toDateTimeString()) : null,
        ];

        // Sensitive fields - only for admins
        if ($isAdmin) {
            $userData['phone'] = $user->phone ?? null;
            $userData['cin'] = $user->cin ?? null;
            $userData['formation_id'] = $user->formation_id ?? null;
            $userData['account_state'] = $user->account_state ?? 0;
            $userData['state'] = $user->account_state ?? 0;
            $userData['access_cowork'] = $user->access_cowork ?? 0;
            $userData['access_studio'] = $user->access_studio ?? 0;
            $userData['wakatime_api_key'] = $user->wakatime_api_key ? substr($user->wakatime_api_key, 0, 10).'...' : null;
        }

        // Always include last_online for profile display
        $userData['last_online'] = $user->last_online ? (is_string($user->last_online) ? $user->last_online : $user->last_online->format('Y-m-d H:i:s')) : null;

        // Add followers and following counts
        $userData['followers_count'] = $user->followers()->count();
        $userData['following_count'] = $user->following()->count();

        // Add posts count
        $userData['posts_count'] = $user->posts()->count();

        return response()->json($userData);
    }

    public function show(Request $request, $userId)
    {
        $currentUser = Auth::guard('sanctum')->user();

        if (! $currentUser) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $currentUserRoles = [];
        if (isset($currentUser->role)) {
            $currentUserRoles = is_array($currentUser->role) ? $currentUser->role : (is_string($currentUser->role) ? json_decode($currentUser->role, true) ?? [$currentUser->role] : [$currentUser->role]);
        }
        $currentUserRolesLower = array_map('strtolower', $currentUserRoles);
        $isRecruiter = in_array('recruiter', $currentUserRolesLower, true);
        if ($isRecruiter && (int) $userId !== (int) $currentUser->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = User::where('id', $userId)->where('account_state', 0)->first();

        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Handle roles
        $roles = [];
        if (isset($user->role)) {
            $roles = is_array($user->role) ? $user->role : (is_string($user->role) ? json_decode($user->role, true) ?? [$user->role] : [$user->role]);
        }

        $isAdmin = in_array('admin', $currentUserRolesLower, true) || in_array('coach', $currentUserRolesLower, true);

        // Base user data
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->image ? url('storage/'.$user->image) : null,
            'image' => $user->image ?? null,
            'roles' => $roles,
            'role' => $roles,
            'promo' => $user->promo ?? null,
            'status' => $user->status ?? null,
            'created_at' => $user->created_at ? (is_string($user->created_at) ? $user->created_at : $user->created_at->toDateTimeString()) : null,
            'updated_at' => $user->updated_at ? (is_string($user->updated_at) ? $user->updated_at : $user->updated_at->toDateTimeString()) : null,
        ];

        // Always include last_online
        $userData['last_online'] = $user->last_online ? (is_string($user->last_online) ? $user->last_online : $user->last_online->format('Y-m-d H:i:s')) : null;

        // Add followers and following counts
        $userData['followers_count'] = $user->followers()->count();
        $userData['following_count'] = $user->following()->count();

        // Add posts count
        $userData['posts_count'] = $user->posts()->count();

        // Sensitive fields - only for admins
        if ($isAdmin) {
            $userData['phone'] = $user->phone ?? null;
            $userData['cin'] = $user->cin ?? null;
            $userData['formation_id'] = $user->formation_id ?? null;
            $userData['account_state'] = $user->account_state ?? 0;
            $userData['access_cowork'] = $user->access_cowork ?? 0;
            $userData['access_studio'] = $user->access_studio ?? 0;
            $userData['wakatime_api_key'] = $user->wakatime_api_key ? substr($user->wakatime_api_key, 0, 10).'...' : null;
        }

        return response()->json($userData);
    }
}
