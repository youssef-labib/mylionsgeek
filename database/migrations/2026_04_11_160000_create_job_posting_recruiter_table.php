<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_posting_recruiter', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_posting_id')->constrained('job_postings')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['job_posting_id', 'user_id']);
        });

        if (Schema::hasTable('job_postings')) {
            $rows = DB::table('job_postings')->whereNotNull('user_id')->get(['id', 'user_id']);
            $now = now();
            foreach ($rows as $row) {
                DB::table('job_posting_recruiter')->insertOrIgnore([
                    'job_posting_id' => $row->id,
                    'user_id' => $row->user_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            DB::table('job_postings')->update(['user_id' => null]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_posting_recruiter');
    }
};
