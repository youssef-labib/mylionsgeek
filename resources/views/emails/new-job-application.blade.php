@extends('emails.layouts.customMail')

@section('content')
    <div
        style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; background-color: #f9f9f9; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

        <h2 style="color: #2c3e50;">{{ __('New job application') }}</h2>

        <p style="font-size: 16px; line-height: 1.6;">
            {{ __('A student has applied to one of your assigned postings.') }}
        </p>

        <div style="background-color: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc801;">
            <h3 style="color: #b45309; margin-top: 0;">{{ __('Job') }}</h3>
            <p style="margin: 5px 0;"><strong>{{ __('Title') }}:</strong> {{ $jobTitle }}</p>
            <p style="margin: 5px 0;"><strong>{{ __('Reference') }}:</strong> {{ $jobReference }}</p>
        </div>

        <div style="background-color: #eef2ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="color: #2563eb; margin-top: 0;">{{ __('Application') }}</h3>
            <p style="margin: 5px 0;"><strong>{{ __('Subject') }}:</strong> {{ $applicationSubject }}</p>
            <p style="margin: 5px 0; white-space: pre-wrap;"><strong>{{ __('Description') }}:</strong><br>{{ $description }}</p>
        </div>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">{{ __('Applicant') }}</h3>
            <p style="margin: 5px 0;"><strong>{{ __('Name') }}:</strong> {{ $applicantName }}</p>
            <p style="margin: 5px 0;"><strong>{{ __('Email') }}:</strong> {{ $applicantEmail }}</p>
        </div>

        <p style="font-size: 14px; color: #555;">
            {{ __('The CV is attached to this email when provided.') }}
        </p>

        <p style="margin: 24px 0;">
            <a href="{{ $applicationsUrl }}"
                style="background-color:#ffc801;color:#111;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;font-weight:bold;">
                {{ __('View applications in dashboard') }}
            </a>
        </p>
    </div>
@endsection
