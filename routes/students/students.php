<?php

use App\Http\Controllers\EducationController;
use App\Http\Controllers\ExperienceController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\UserSocialLinkController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::middleware(['auth', 'verified', 'role:admin,coach,student,studio_responsable'])->prefix('students')->group(function () {
    Route::put('/update/{user}', [UsersController::class, 'update']);
    Route::get('/feed', [StudentController::class, 'index'])->name('student.feed');
    Route::get('/{id}/posts', [StudentController::class, 'userPosts'])->whereNumber('id')->name('student.posts');
    Route::get('/{id}', [StudentController::class, 'userProfile'])->whereNumber('id');
    Route::post('/changeCover/{id}', [StudentController::class, 'changeCover']);
    Route::post('/changeProfileImage/{id}', [StudentController::class, 'changeProfileImage']);
    Route::post('/about/{id}', [StudentController::class, 'updateAbout']);
    Route::post('/follow/{user}', [FollowController::class, 'create']);
    Route::delete('/unfollow/{user}', [FollowController::class, 'delete']);
    Route::post('/social-links', [UserSocialLinkController::class, 'create']);
    Route::put('/social-links/{id}', [UserSocialLinkController::class, 'update']);
    Route::delete('/social-links/{id}', [UserSocialLinkController::class, 'delete']);
    Route::post('/social-links/reorder', [UserSocialLinkController::class, 'reorderSocialLinks']);
    Route::post('/experience', [ExperienceController::class, 'create']);
    Route::put('/experience/{id}', [ExperienceController::class, 'update']);
    Route::delete('/experience/{id}', [ExperienceController::class, 'delete']);
    Route::post('/education', [EducationController::class, 'create']);
    Route::put('/education/{id}', [EducationController::class, 'update']);
    Route::delete('/education/{id}', [EducationController::class, 'delete']);
});
