<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'full_name',
        'nic_number',
        'phone',
        'email',
        'address',
        'driving_license_number',
        'license_expiry_date',
    ];

    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class);
    }
}