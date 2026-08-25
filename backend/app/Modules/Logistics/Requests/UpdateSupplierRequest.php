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
            'phone' => ['nullable', 'regex:/^\d{1,10}$/'],
            'address' => 'nullable|string',
            'organic_certified' => 'sometimes|boolean',
            'certificate_expires_at' => 'nullable|date',
            'certification' => 'nullable|array',
            'certification.certificate_number' => 'nullable|string|max:100',
            'certification.certifying_entity' => 'nullable|string|max:150',
            'certification.issued_at' => 'nullable|date',
            'certification.expires_at' => 'nullable|date',
            'certification.file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'status' => 'sometimes|in:active,inactive',
        ];
    }
}
