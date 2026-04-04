<?php

namespace App\Http\Controllers;

use App\Models\Education;
use App\Models\Experience;
use App\Models\Follower;
use App\Models\FollowNotification;
use App\Models\Like;
use App\Models\Post;
use App\Models\UserSocialLink;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use function PHPSTORM_META\map;

class StudentController extends Controller
{
    public function index()
    {
        $userController = new UsersController();
        $posts = $userController->getPosts();
        $userId = Auth::user()->id;
        $user = $this->getUserInfo($userId);
        return Inertia::render('students/user/index', [
            'posts' => $posts,
            'user' => $user
        ]);
    }
    public function userProfile($id)
    {
        $user = $this->getUserInfo($id);
        $usersController = new UsersController();
        $profilePosts = $usersController->getPostsForProfileUser((int) $id, 1);

        return Inertia::render('students/user/partials/StudentProfile', [
            'user' => $user,
            'profilePostsPreview' => $profilePosts['posts']->values()->all(),
            'profilePostsTotal' => $profilePosts['total'],
        ]);
    }

    public function userPosts($id)
    {
        $user = $this->getUserInfo($id);
        $usersController = new UsersController();
        $profilePosts = $usersController->getPostsForProfileUser((int) $id, null);

        return Inertia::render('students/user/UserPosts', [
            'user' => $user,
            'posts' => $profilePosts['posts']->values()->all(),
            'postsTotal' => $profilePosts['total'],
        ]);
    }
    public function getUserInfo($id)
    {
        $user = User::find($id);
        $userExperience = User::with(['experiences' => function ($query) {
            $query->orderBy('start_year', 'desc')->orderBy('start_month', 'desc');
        }])->findOrFail($id);
        $userEducation = User::with([
            'educations' => function ($query) {
                $query->orderBy('start_year', 'desc')->orderBy('start_month', 'desc');
            }
        ])->findOrFail($id);
        $userSocialLinks = User::with(['socialLinks' => function ($query) {
            $query->ordered();
        }])->findOrFail($id);
        $isFollowing = Auth::user()
            ->following()
            ->where('followed_id', $id)
            ->exists();
        // dd($isFollowing);
        $followers = User::find($id)
            ->followers()
            ->select('users.id', 'users.name', 'users.image')
            ->get();
        $following = User::find($id)
            ->following()
            ->select('users.id', 'users.name', 'users.image')
            ->get();

        return  [
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'image' => $user->image,
                'online' => $user->last_online,
                'Gp' => $user->GP,
                'Xp' => $user->XP,
                'about' => $user->about,
                'socials' => $user->socials,
                'level' => $user->level,
                'promo' => $user->promo,
                'cover' => $user->cover,
                'name' => $user->name,
                'last_online' => $user->last_online,
                'status' => $user->status,
                'field' => $user->field,
                'phone' => $user->phone,
                'created_at' => $user->created_at->format('Y-m-d'),
                'formation' => $user->formation_id != Null ? $user->formation->name : '',
                'formation_id' => $user->formation_id,
                'cin' => $user->cin,
                'access_studio' => $user->access_studio,
                'access_cowork' => $user->access_cowork,
                'role' => $user->role,
                'followers' => $followers,
                'following' => $following,
                'isFollowing' => $isFollowing,
                'experiences' => $userExperience->experiences,
                'educations' => $userEducation->educations,
                'social_links' => $userSocialLinks->socialLinks,
            ],
        ];
    }
    public function changeProfileImage(Request $request, $id)
    {
        $user = User::find($id);
        if (Auth::user()->id == $user->id) {
            # code...
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            ]);
            if ($request->hasFile('image') && $request->file('image')->isValid()) {
                $file = $request->file('image');
                $path = $file->store('img/profile', 'public');
                $request->image = basename($path);
                $user->update([
                    'image' => $request->image,
                ]);

                return redirect()->back()->with('success', 'image changed successfully');
            }

            return redirect()->back()->with('error', 'There was an error changing the image.');
        };
    }
    public function changeCover(Request $request, $id)
    {
        $user = User::find($id);
        if (Auth::user()->id == $user->id) {
            $request->validate([
                'cover' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            ]);
            if ($request->hasFile('cover') && $request->file('cover')->isValid()) {
                $path = $request->file('cover')->store('img/cover', 'public');
                $user->update([
                    'cover' => $path,
                ]);

                return redirect()->back()->with('success', 'Cover changed successfully');
            }

            return redirect()->back()->with('error', 'There was an error changing the cover.');
        };
    }
    public function updateAbout(Request $request, $id)
    {
        if (Auth::id() !== (int) $id) {
            abort(403);
        }

        $request->validate([
            'about' => 'string|max:500|min:100|required',
        ]);

        $user = User::findOrFail($id);

        $user->update([
            'about' => $request->about,
        ]);

        return back()->with('success', 'About updated successfully');
    }
}
