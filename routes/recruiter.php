<?php

use App\Http\Controllers\Recruiter\RecruiterApplicationController;
use App\Http\Controllers\Recruiter\RecruiterDashboardController;
use App\Http\Controllers\Recruiter\RecruiterInterviewController;
use App\Http\Controllers\Recruiter\RecruiterJobController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:recruiter'])->prefix('recruiter')->group(function () {
    Route::get('/dashboard', RecruiterDashboardController::class)->name('recruiter.dashboard');
    Route::get('/jobs', [RecruiterJobController::class, 'index'])->name('recruiter.jobs.index');
    Route::get('/applications', [RecruiterApplicationController::class, 'index'])->name('recruiter.applications.index');
    Route::get('/applications/{application}/cv', [RecruiterApplicationController::class, 'downloadCv'])
        ->whereNumber('application')
        ->name('recruiter.applications.cv');

    Route::get('/interviews', [RecruiterInterviewController::class, 'index'])->name('recruiter.interviews.index');
    Route::post('/interviews', [RecruiterInterviewController::class, 'store'])->name('recruiter.interviews.store');
    Route::put('/interviews/{recruiterInterview}', [RecruiterInterviewController::class, 'update'])
        ->whereNumber('recruiterInterview')
        ->name('recruiter.interviews.update');
    Route::delete('/interviews/{recruiterInterview}', [RecruiterInterviewController::class, 'destroy'])
        ->whereNumber('recruiterInterview')
        ->name('recruiter.interviews.destroy');
});
