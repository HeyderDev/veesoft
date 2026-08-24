<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReceivePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quality_status' => 'required|in:approved,rejected,conditional',
            'observations' => 'nullable|string',
            'photo_evidence_url' => 'nullable|string|max:255',
        ];
    }
}
