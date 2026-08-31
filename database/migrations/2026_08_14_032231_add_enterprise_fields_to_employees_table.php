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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('job_title')->nullable();
            $table->enum('employment_status', ['permanent', 'contract', 'probation'])->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('npwp_number')->nullable();
            $table->string('bpjs_kesehatan')->nullable();
            $table->string('bpjs_ketenagakerjaan')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->integer('annual_leave_quota')->default(12);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'job_title',
                'employment_status',
                'bank_name',
                'bank_account',
                'npwp_number',
                'bpjs_kesehatan',
                'bpjs_ketenagakerjaan',
                'phone',
                'address',
                'annual_leave_quota',
            ]);
        });
    }
};
