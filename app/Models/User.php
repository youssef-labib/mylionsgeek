<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Mail;
use App\Mail\ForgotPasswordLinkMail;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',               // UUID primary key
        'name',
        'email',
        'password',
        'role',
        'phone',
        'cin',
        'status',
        'formation_id',
        'account_state',
        'image',
        'cover', // add cover here
        'about', // short bio
        'socials', // social links JSON
        'access_cowork',
        'access_studio',
        'promo',
        'remember_token',
        'email_verified_at',
        // 'remember_token',
        'created_at',
        'updated_at',
        'wakatime_api_key',
        'last_online',
        'activation_token',
        'expo_push_token', // Expo push notification token
        // 'xp'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'array',
            'socials' => 'array',
        ];
    }

    protected $casts = [
        'role' => 'array',
        'socials' => 'array',
    ];


    public function access(): HasOne
    {
        return $this->hasOne(Access::class);
    }
    public function formation()
    {
        return $this->belongsTo(Formation::class, 'formation_id');
    }

    /**
     * User projects
     */
    // public function projects()
    // {
    //     return $this->hasMany(UserProject::class, 'user_id');
    // }

    public function studentProjects(): HasMany
    {
        return $this->hasMany(StudentProject::class, 'user_id');
    }

    /**
     * Projects this user approved
     */
    public function approvedProjects()
    {
        return $this->hasMany(StudentProject::class, 'approved_by');
    }


    /**
     * Get Geekos created by this user.
     */
    public function createdGeekos()
    {
        return $this->hasMany(Geeko::class, 'created_by');
    }

    /**
     * Get Geeko sessions started by this user.
     */
    public function startedSessions()
    {
        return $this->hasMany(GeekoSession::class, 'started_by');
    }

    /**
     * Get Geeko participations for this user.
     */
    public function geekoParticipations()
    {
        return $this->hasMany(GeekoParticipant::class, 'user_id');
    }
    public function scopeActive($query)
    {
        return $query->where('account_state', 0);
    }

    /**
     * User has many reservations as creator
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'user_id');
    }

    /**
     * User can be in many reservation teams (Many-to-Many)
     */
    public function reservationTeams()
    {
        return $this->belongsToMany(Reservation::class, 'reservation_teams', 'user_id', 'reservation_id')->withTimestamps();
    }
    public function badges()
    {
        return $this->belongsToMany(Badge::class)->withTimestamps();
    }
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
    public function likes()
    {
        return $this->hasMany(Like::class);
    }
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get conversations where this user is user_one
     */
    public function conversationsAsUserOne()
    {
        return $this->hasMany(Conversation::class, 'user_one_id');
    }

    /**
     * Get conversations where this user is user_two
     */
    public function conversationsAsUserTwo()
    {
        return $this->hasMany(Conversation::class, 'user_two_id');
    }

    /**
     * Get all conversations for this user
     */
    public function conversations()
    {
        return Conversation::where('user_one_id', $this->id)
            ->orWhere('user_two_id', $this->id);
    }

    /**
     * Get all messages sent by this user
     */
    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Send the password reset notification using our custom mailable and layout.
     */
    public function sendPasswordResetNotification($token)
    {
        $resetUrl = url(route('password.reset', ['token' => $token, 'email' => $this->email], false));

        Mail::to($this->email)->send(new ForgotPasswordLinkMail($this, $resetUrl));
    }
    //! Followers relationship
    public function followers()
    {
        return $this->belongsToMany(
            User::class,
            'followers',
            'followed_id',
            'follower_id'
        )->withTimestamps();
    }

    // People I follow
    public function following()
    {
        return $this->belongsToMany(
            User::class,
            'followers',
            'follower_id',
            'followed_id'
        )->withTimestamps();
    }
    public function experiences()
    {
        return $this->belongsToMany(Experience::class)->withTimestamps();
    }
    public function educations()
    {
        return $this->belongsToMany(Education::class)->withTimestamps();
    }

    public function socialLinks()
    {
        return $this->hasMany(UserSocialLink::class);
    }

    /** Job postings this recruiter is assigned to (not necessarily the creator). */
    public function assignedJobPostings(): BelongsToMany
    {
        return $this->belongsToMany(Job::class, 'job_posting_recruiter', 'user_id', 'job_posting_id')->withTimestamps();
    }
}
