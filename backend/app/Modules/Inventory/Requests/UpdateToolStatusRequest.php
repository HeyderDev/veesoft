<?php

namespace App\Modules\Inventory\Requests;

use App\Modules\Inventory\Models\Tool;
use Illuminate\Foundation\Http\FormRequest;

class UpdateToolStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:'.implode(',', [
                'available',
                'borrowed',
                'maintenance',
                'out_of_service',
            ]),
            'details' => 'nullable|array',
        ];
    }
}
