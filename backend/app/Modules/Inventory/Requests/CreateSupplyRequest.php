<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateSupplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'unit' => 'nullable|string|max:50',
            'current_stock' => 'nullable|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
        ];
    }
}
