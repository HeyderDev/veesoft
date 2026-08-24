<?php

namespace App\Modules\Logistics\Models;

use App\Modules\Shared\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id', 'evaluated_by', 'compliance', 'quality',
        'punctuality', 'price', 'after_sales_service', 'comment',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }
}
