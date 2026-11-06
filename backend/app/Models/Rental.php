<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rental extends Model
{
    protected $fillable = [
        'vehicle_id',
        'customer_id',
        'pickup_date',
        'return_date',
        'actual_return_date',
        'daily_rate',
        'total_amount',
        'deposit_amount',
        'paid_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'pickup_date' => 'datetime',
        'return_date' => 'datetime',
        'actual_return_date' => 'datetime',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}