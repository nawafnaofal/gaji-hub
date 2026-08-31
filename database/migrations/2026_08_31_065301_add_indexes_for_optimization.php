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
        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['employee_id', 'date']);
            $table->index('status');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->index('employee_id');
            $table->index(['period_year', 'period_month']);
            $table->index('status');
        });

        Schema::table('leaves', function (Blueprint $table) {
            $table->index('employee_id');
            $table->index('status');
        });

        Schema::table('overtimes', function (Blueprint $table) {
            $table->index('employee_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex(['employee_id', 'date']);
            $table->dropIndex(['status']);
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['period_year', 'period_month']);
            $table->dropIndex(['status']);
        });

        Schema::table('leaves', function (Blueprint $table) {
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('overtimes', function (Blueprint $table) {
            $table->dropIndex(['employee_id']);
            $table->dropIndex(['status']);
        });
    }
};
