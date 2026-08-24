<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'description' => ['nullable', 'string', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'quantity' => 'nullable|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'El nombre solo puede contener letras.',
            'description.regex' => 'La descripción solo puede contener letras.',
        ];
    }
}
