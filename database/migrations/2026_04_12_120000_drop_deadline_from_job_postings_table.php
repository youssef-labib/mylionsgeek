<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            if (Schema::hasColumn('job_postings', 'deadline')) {
                $table->dropColumn('deadline');
            }
        });
    }

    public function down(): void
    {
        Schema::table('job_postings', function (Blueprint $table) {
            if (! Schema::hasColumn('job_postings', 'deadline')) {
                $table->date('deadline')->nullable();
            }
        });
    }
};
