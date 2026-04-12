<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('title');
            $table->text('description');
            $table->string('location')->nullable();
            $table->string('job_type');
            $table->json('skills')->nullable();
            $table->boolean('is_published')->default(true);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['is_published', 'job_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
