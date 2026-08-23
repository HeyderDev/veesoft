<?php

namespace App\Modules\Logistics\Models;

<<<<<<< HEAD
=======
use App\Modules\Shared\Traits\BelongsToVivero;
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
<<<<<<< HEAD
    use HasFactory, SoftDeletes;
=======
    use HasFactory, SoftDeletes, BelongsToVivero;
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
<<<<<<< HEAD
        'name', 'tax_id', 'email', 'phone', 'address',
=======
        'vivero_id', 'name', 'tax_id', 'email', 'phone', 'address',
>>>>>>> 727f1891df3d6119d5da307f211624a5f3ab9519
        'organic_certified', 'certificate_expires_at', 'score', 'status',
    ];

    protected $casts = [
        'organic_certified' => 'boolean',
        'certificate_expires_at' => 'date',
        'score' => 'decimal:2',
    ];

    public function evaluations(): HasMany
    {
        return $this->hasMany(SupplierEvaluation::class);
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
