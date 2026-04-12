<?php

namespace App\Mail;

use App\Models\Job;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class NewJobApplicationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Job $job,
        public JobApplication $application,
        public User $applicant,
        public string $applicationsUrl,
    ) {}

    public function build()
    {
        $subjectLine = __('New application: :title', ['title' => $this->application->subject ?: $this->job->title]);

        $mail = $this->subject($subjectLine)
            ->view('emails.new-job-application')
            ->with([
                'subjectLine' => $subjectLine,
                'jobTitle' => $this->job->title,
                'jobReference' => $this->job->reference,
                'applicationSubject' => $this->application->subject,
                'description' => $this->application->cover_letter,
                'applicantName' => $this->applicant->name,
                'applicantEmail' => $this->applicant->email,
                'applicationsUrl' => $this->applicationsUrl,
            ]);

        $cvPath = $this->application->cv_path;
        if ($cvPath && Storage::disk('public')->exists($cvPath)) {
            $ext = pathinfo($cvPath, PATHINFO_EXTENSION) ?: 'pdf';
            $safeName = preg_replace('/[^a-z0-9_-]+/i', '_', $this->applicant->name) ?: 'applicant';
            $mail->attach(Storage::disk('public')->path($cvPath), [
                'as' => 'cv_'.$safeName.'.'.$ext,
                'mime' => Storage::disk('public')->mimeType($cvPath) ?? 'application/octet-stream',
            ]);
        }

        return $mail;
    }
}
