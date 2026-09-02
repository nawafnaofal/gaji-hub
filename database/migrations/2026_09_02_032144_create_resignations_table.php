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
        Schema::create('resignations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->date('resign_date');
            $table->text('reason');
            $table->enum('type', ['voluntary', 'terminated']);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->decimal('severance_pay', 15, 2)->default(0);
            $table->decimal('upmk_pay', 15, 2)->default(0);
            $table->decimal('uph_pay', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resignations');
    }
};
