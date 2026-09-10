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
        Schema::create('shift_exchanges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('requester_shift_id')->constrained('employee_shifts')->cascadeOnDelete();
            $table->foreignId('target_employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('target_shift_id')->constrained('employee_shifts')->cascadeOnDelete();
            $table->text('reason')->nullable();
            $table->string('status')->default('pending_peer'); // pending_peer, pending_approval, approved, rejected, cancelled
            $table->timestamp('peer_approved_at')->nullable();
            $table->timestamp('manager_approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_exchanges');
    }
};
