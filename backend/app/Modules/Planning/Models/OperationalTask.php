<?php

namespace App\Modules\Planning\Models;

use Database\Factories\OperationalTaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperationalTask extends Model
{
    /** @use HasFactory<OperationalTaskFactory> */
    use HasFactory;
}
