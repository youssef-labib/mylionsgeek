<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recruiter_interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('job_application_id')->nullable()->constrained('job_applications')->nullOnDelete();
            $table->string('group_label', 120)->nullable();
            $table->string('title', 255);
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruiter_interviews');
    }
};
