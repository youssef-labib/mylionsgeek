<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add index only if it does not already exist (avoids error on re-run).
     */
    // private function addIndexIfNotExists(string $table, array $columns, ?string $name = null): void
    // {
    //     $name = $name ?? $table . '_' . implode('_', $columns) . '_index';
    //     $driver = Schema::getConnection()->getDriverName();

    //     if ($driver === 'sqlite') {
    //         $exists = DB::selectOne(
    //             "SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?",
    //             [$name]
    //         );
    //         if ($exists) {
    //             return;
    //         }
    //     } elseif ($driver === 'mysql') {
    //         $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$name]);
    //         if (count($indexes) > 0) {
    //             return;
    //         }
    //     }

    //     Schema::table($table, function (Blueprint $t) use ($columns) {
    //         $t->index($columns);
    //     });
    // }

    /**
     * Run the migrations.
     */
    // public function up(): void
    // {
    //     $this->addIndexIfNotExists('comments', ['post_id', 'created_at']);
    //     $this->addIndexIfNotExists('comments', ['user_id'], 'comments_user_id_index');

    //     $this->addIndexIfNotExists('likes', ['post_id', 'user_id']);
    //     $this->addIndexIfNotExists('likes', ['post_id', 'created_at']);

    //     $this->addIndexIfNotExists('comment_likes', ['comment_id', 'user_id']);
    //     $this->addIndexIfNotExists('comment_likes', ['comment_id', 'created_at']);
    // }

    /**
     * Reverse the migrations.
     */
    // public function down(): void
    // {
    //     Schema::table('comments', function (Blueprint $table) {
    //         $table->dropIndex(['post_id', 'created_at']);
    //         $table->dropIndex(['user_id']);
    //     });

    //     Schema::table('likes', function (Blueprint $table) {
    //         $table->dropIndex(['post_id', 'user_id']);
    //         $table->dropIndex(['post_id', 'created_at']);
    //     });

    //     Schema::table('comment_likes', function (Blueprint $table) {
    //         $table->dropIndex(['comment_id', 'user_id']);
    //         $table->dropIndex(['comment_id', 'created_at']);
    //     });
    // }
};
