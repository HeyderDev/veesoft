<?php

namespace App\Modules\Planning\Models;

use Database\Factories\ProductionHistoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionHistory extends Model
{
    /** @use HasFactory<ProductionHistoryFactory> */
    use HasFactory;
}
