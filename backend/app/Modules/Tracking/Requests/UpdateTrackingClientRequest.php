<?php

namespace App\Modules\Tracking\Requests;

use App\Modules\Tracking\Rules\EcuadorianCedula;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTrackingClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150', 'regex:/^[\pL\s]+$/u'],
            'cedula' => [
                'sometimes', 'digits:10', new EcuadorianCedula,
                Rule::unique('tracking_clients', 'cedula')->ignore($this->route('trackingClient')),
            ],
            'phone' => ['sometimes', 'digits:10'],
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
