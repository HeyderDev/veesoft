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
            'items.*.item_type' => 'required|in:supply,tool',
            'items.*.item_id' => 'required|integer|distinct',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ];
    }
}
