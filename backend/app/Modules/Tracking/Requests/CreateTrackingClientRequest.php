<?php

namespace App\Modules\Tracking\Requests;

use App\Modules\Tracking\Rules\EcuadorianCedula;
use Illuminate\Foundation\Http\FormRequest;

class CreateTrackingClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150', 'regex:/^[\pL\s]+$/u'],
            'cedula' => ['required', 'digits:10', 'unique:tracking_clients,cedula', new EcuadorianCedula],
            'phone' => ['required', 'digits:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'El nombre del cliente/corporación solo puede contener letras.',
            'cedula.digits' => 'La cédula debe tener exactamente 10 dígitos.',
            'cedula.unique' => 'Ya existe un cliente registrado con esta cédula.',
            'phone.digits' => 'El número celular debe tener exactamente 10 dígitos.',
        ];
    }
}
