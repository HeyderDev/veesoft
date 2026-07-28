<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:150',
            'tax_id' => 'sometimes|string|regex:/^\d{10}(\d{3})?$/',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'organic_certified' => 'sometimes|boolean',
            'certificate_expires_at' => 'nullable|date',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
