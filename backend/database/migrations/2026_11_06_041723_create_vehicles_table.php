<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_name');
            $table->string('brand');
            $table->string('model');
            $table->string('registration_number')->unique();
            $table->string('vehicle_type')->nullable();
            $table->integer('manufacture_year')->nullable();
            $table->integer('seating_capacity')->default(5);
            $table->decimal('daily_rate', 10, 2);
            $table->string('fuel_type')->nullable();
            $table->string('transmission')->nullable();
            $table->string('image')->nullable();

            $table->enum('status', [
                'available',
                'rented',
                'maintenance'
            ])->default('available');

            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};