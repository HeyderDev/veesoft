<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'description' => ['nullable', 'string', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'unit' => 'nullable|string|max:50',
            'current_stock' => 'nullable|numeric|min:0',
            'total_stock' => 'nullable|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'El nombre del insumo solo puede contener letras.',
            'description.regex' => 'La descripción solo puede contener letras.',
        ];
    }
}
