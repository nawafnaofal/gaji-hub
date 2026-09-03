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
        Schema::create('warning_letters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('letter_number')->unique();
            $table->enum('sp_level', ['sp_1', 'sp_2', 'sp_3'])->default('sp_1');
            $table->date('violation_date');
            $table->date('valid_until');
            $table->text('description');
            $table->text('sanction')->nullable();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->string('issued_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warning_letters');
    }
};
