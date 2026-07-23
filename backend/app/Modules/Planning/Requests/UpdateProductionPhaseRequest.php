<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductionPhaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'execution_order' => 'sometimes|integer|min:1',
            'estimated_duration_days' => 'sometimes|integer|min:1',
            'color_reference' => 'nullable|string|max:30',
        ];
    }
}
