<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EvaluateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'compliance' => 'required|integer|between:1,5',
            'quality' => 'required|integer|between:1,5',
            'punctuality' => 'required|integer|between:1,5',
            'price' => 'required|integer|between:1,5',
            'after_sales_service' => 'required|integer|between:1,5',
            'comment' => 'nullable|string',
        ];
    }
}
