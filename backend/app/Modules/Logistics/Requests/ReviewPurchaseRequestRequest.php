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
            'supplier_id' => 'required_if:decision,approved|integer|exists:suppliers,id',
            'estimated_delivery_date' => 'nullable|date',
        ];
    }
}
