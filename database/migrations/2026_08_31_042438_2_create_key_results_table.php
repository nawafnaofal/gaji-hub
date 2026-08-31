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
        Schema::create('key_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objective_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->integer('target_value');
            $table->integer('current_value')->default(0);
            $table->string('unit')->default('%');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('key_results');
    }
};
