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
        Schema::table('leaves', function (Blueprint $table) {
            $table->string('attachment')->nullable()->after('reason');
        });
        Schema::table('reimbursements', function (Blueprint $table) {
            $table->string('attachment')->nullable()->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropColumn('attachment');
        });
        Schema::table('reimbursements', function (Blueprint $table) {
            $table->dropColumn('attachment');
        });
    }
};
