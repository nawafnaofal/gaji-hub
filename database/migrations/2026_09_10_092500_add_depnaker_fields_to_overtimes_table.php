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
        Schema::table('overtimes', function (Blueprint $table) {
            $table->string('day_type')->default('workday')->after('duration_hours'); // 'workday' or 'holiday'
            $table->decimal('hourly_rate', 12, 2)->default(0)->after('day_type');
            $table->decimal('multiplier_hours', 5, 2)->default(0)->after('hourly_rate');
            $table->decimal('total_pay', 12, 2)->default(0)->after('multiplier_hours');
            $table->json('breakdown')->nullable()->after('total_pay');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('overtimes', function (Blueprint $table) {
            $table->dropColumn(['day_type', 'hourly_rate', 'multiplier_hours', 'total_pay', 'breakdown']);
        });
    }
};
