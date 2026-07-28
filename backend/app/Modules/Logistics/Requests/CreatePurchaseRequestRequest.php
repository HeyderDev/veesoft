<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.item_sku' => 'nullable|string|max:50',
            'items.*.item_name' => 'required|string|max:150',
            'items.*.unit' => 'required|string|max:20',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ];
    }
}
