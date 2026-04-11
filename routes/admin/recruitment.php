<?php

use App\Http\Controllers\Admin\JobPostingController;
use App\Http\Controllers\Admin\RecruiterController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin,super_admin,moderateur'])->prefix('admin')->group(function () {
    Route::get('/jobs', [JobPostingController::class, 'index'])->name('admin.jobs.index');
    Route::get('/jobs/create', [JobPostingController::class, 'create'])->name('admin.jobs.create');
    Route::post('/jobs', [JobPostingController::class, 'store'])->name('admin.jobs.store');
    Route::get('/jobs/{job}/edit', [JobPostingController::class, 'edit'])->name('admin.jobs.edit');
    Route::put('/jobs/{job}', [JobPostingController::class, 'update'])->name('admin.jobs.update');

    Route::get('/recruiters', [RecruiterController::class, 'index'])->name('admin.recruiters.index');
    Route::post('/recruiters', [RecruiterController::class, 'store'])->name('admin.recruiters.store');
});
