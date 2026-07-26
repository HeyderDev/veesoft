<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReviewPurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision' => 'required|in:approved,rejected',
            'order_number' => 'nullable|string|max:30|unique:purchase_orders,order_number',
            'supplier_id' => 'required_if:decision,approved|integer|exists:suppliers,id',
            'estimated_delivery_date' => 'nullable|date',
            'unit_prices' => 'sometimes|array',
            'unit_prices.*' => 'numeric|min:0',
        ];
    }
}
