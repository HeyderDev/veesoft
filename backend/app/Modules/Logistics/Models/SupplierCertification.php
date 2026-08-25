<?php

namespace App\Modules\Logistics\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id', 'has_certificate', 'certificate_number', 'certifying_entity',
        'issued_at', 'expires_at', 'file_path', 'registered_at',
    ];

    protected $casts = [
        'has_certificate' => 'boolean',
        'issued_at' => 'date:Y-m-d',
        'expires_at' => 'date:Y-m-d',
        'registered_at' => 'datetime',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
