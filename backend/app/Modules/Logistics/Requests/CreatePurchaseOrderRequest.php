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
            'order_number' => 'nullable|string|max:30|unique:purchase_orders,order_number',
            'supplier_id' => 'required|integer|exists:suppliers,id',
            'estimated_delivery_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.item_sku' => 'nullable|string|max:50',
            'items.*.item_name' => 'required|string|max:150',
            'items.*.unit' => 'required|string|max:20',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ];
    }
}
