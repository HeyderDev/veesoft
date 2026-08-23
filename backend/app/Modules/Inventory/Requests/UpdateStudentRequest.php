<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $studentId = $this->route('student');
        return [
            'first_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'last_name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/'],
            'cedula' => ['required', 'string', 'size:10', 'regex:/^[0-9]+$/', 'unique:students,cedula,' . $studentId],
            'career_id' => 'required|exists:careers,id',
            'semester' => 'required|integer|min:1|max:10',
            'status' => 'required|string|in:active,inactive',
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
