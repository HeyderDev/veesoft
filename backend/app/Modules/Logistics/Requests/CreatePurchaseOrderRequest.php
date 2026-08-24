<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'estimated_delivery_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.item_type' => 'required|in:supply,tool',
            'items.*.item_id' => 'required|integer|distinct',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ];
    }
}
