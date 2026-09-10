<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('category')->default('general')->after('title'); // general, policy, event, urgent
            $table->boolean('is_pinned')->default(false)->after('is_active');
            $table->string('attachment_path')->nullable()->after('content');
            $table->string('target_department')->nullable()->after('attachment_path'); // null for all departments
        });

        Schema::create('announcement_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained('announcements')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at')->useCurrent();
            $table->timestamps();

            $table->unique(['announcement_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcement_reads');

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['category', 'is_pinned', 'attachment_path', 'target_department']);
        });
    }
};
