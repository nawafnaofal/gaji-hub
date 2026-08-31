<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['leaves', 'reimbursements', 'overtimes', 'cash_advances'];
        
        foreach ($tables as $table) {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE {$table} MODIFY status ENUM('pending', 'pending_manager', 'pending_hr', 'approved', 'rejected') DEFAULT 'pending_manager'");
            \Illuminate\Support\Facades\DB::statement("UPDATE {$table} SET status = 'pending_manager' WHERE status = 'pending'");
        }
    }

    public function down(): void
    {
    }
};
