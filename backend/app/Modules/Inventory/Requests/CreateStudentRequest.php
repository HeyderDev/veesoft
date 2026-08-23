<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'last_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'cedula' => ['required', 'string', 'size:10', 'regex:/^[0-9]+$/', 'unique:students,cedula'],
            'career' => 'required|string|max:100',
            'semester' => 'required|integer|min:1|max:10',
            'status' => 'nullable|string|in:active,inactive',
        ];
    }

    public function messages(): array
    {
        return [
            'cedula.unique' => 'La cédula ya se encuentra registrada.',
            'cedula.size' => 'La cédula debe tener exactamente 10 dígitos.',
            'cedula.regex' => 'La cédula debe contener solo números.',
            'first_name.regex' => 'Los nombres solo pueden contener letras.',
            'last_name.regex' => 'Los apellidos solo pueden contener letras.',
        ];
    }
}
