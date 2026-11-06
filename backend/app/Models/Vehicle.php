<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'vehicle_name',
        'brand',
        'model',
        'registration_number',
        'vehicle_type',
        'manufacture_year',
        'seating_capacity',
        'daily_rate',
        'fuel_type',
        'transmission',
        'image',
        'status',
        'description',
    ];

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }
}