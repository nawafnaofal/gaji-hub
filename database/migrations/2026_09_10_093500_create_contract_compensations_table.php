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
            $table->date('contract_end_date')->nullable()->after('join_date');
        });

        Schema::create('contract_compensations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->date('contract_start_date');
            $table->date('contract_end_date');
            $table->integer('tenure_months');
            $table->decimal('monthly_wage', 12, 2);
            $table->decimal('compensation_amount', 12, 2);
            $table->string('status')->default('draft'); // draft, approved, paid
            $table->text('notes')->nullable();
            $table->date('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_compensations');

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('contract_end_date');
        });
    }
};
