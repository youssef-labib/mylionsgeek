<?php

use App\Http\Controllers\Recruiter\RecruiterApplicationController;
use App\Http\Controllers\Recruiter\RecruiterJobController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:recruiter'])->prefix('recruiter')->group(function () {
    Route::get('/jobs', [RecruiterJobController::class, 'index'])->name('recruiter.jobs.index');
    Route::get('/applications', [RecruiterApplicationController::class, 'index'])->name('recruiter.applications.index');
});
