<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Shift Pagi", "Office Hours"
            $table->time('clock_in_time'); // e.g., "08:00:00"
            $table->time('clock_out_time'); // e.g., "17:00:00"
            $table->json('work_days'); // e.g., [1,2,3,4,5] (Mon-Fri)
            $table->integer('late_tolerance_minutes')->default(15); // grace period
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add work_schedule_id to employees
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('work_schedule_id')->nullable()->constrained('work_schedules')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\WorkSchedule::class);
        });
        Schema::dropIfExists('work_schedules');
    }
};
