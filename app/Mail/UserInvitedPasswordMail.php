<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/** Always use Mail::send() — never Mail::queue() — so credentials mail is not stored in the jobs table. */
class UserInvitedPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $plainPassword) {}

    public function build(): self
    {
        return $this->subject(config('app.name').' - Your account credentials')
            ->view('emails.user-invited-password')
            ->with([
                'user' => $this->user,
                'plainPassword' => $this->plainPassword,
                'loginUrl' => url('/login'),
            ]);
    }
}
