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
        Schema::create('job_positions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('department');
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->enum('status', ['open', 'closed', 'draft'])->default('open');
            $table->string('type')->default('Full-time');
            $table->string('location')->nullable();
            $table->string('salary_range')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_positions');
    }
};
