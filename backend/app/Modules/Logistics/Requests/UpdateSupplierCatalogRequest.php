<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'present|array',
            'items.*.item_type' => 'required|in:supply,tool',
            'items.*.item_id' => 'required|integer|distinct',
            'items.*.unit_price' => 'required|numeric|min:0',
        ];
    }
}
