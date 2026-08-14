<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateViveroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('planning.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:150',
            'location' => 'sometimes|string|max:150',
            'responsible' => 'sometimes|string|max:150',
        ];
    }
}
