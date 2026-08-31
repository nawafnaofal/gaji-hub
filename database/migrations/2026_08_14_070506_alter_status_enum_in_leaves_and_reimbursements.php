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
        // For MySQL, change enum to string or modify enum. We'll change to string for flexibility.
        DB::statement("ALTER TABLE leaves MODIFY COLUMN status VARCHAR(255) DEFAULT 'pending'");
        DB::statement("ALTER TABLE reimbursements MODIFY COLUMN status VARCHAR(255) DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back is optional or just change to varchar without default
    }
};
