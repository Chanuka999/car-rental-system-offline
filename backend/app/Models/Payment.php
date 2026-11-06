<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'rental_id',
        'amount',
        'payment_method',
        'reference_number',
        'payment_type',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }
}