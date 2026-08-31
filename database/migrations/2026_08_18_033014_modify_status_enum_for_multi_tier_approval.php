<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $enumStr = "ENUM('pending', 'pending_manager', 'pending_hr', 'approved', 'rejected', 'paid')";
        
        DB::statement("ALTER TABLE leaves MODIFY COLUMN status $enumStr DEFAULT 'pending_manager'");
        DB::statement("ALTER TABLE overtimes MODIFY COLUMN status $enumStr DEFAULT 'pending_manager'");
        DB::statement("ALTER TABLE reimbursements MODIFY COLUMN status $enumStr DEFAULT 'pending_manager'");
        DB::statement("ALTER TABLE cash_advances MODIFY COLUMN status $enumStr DEFAULT 'pending_manager'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
