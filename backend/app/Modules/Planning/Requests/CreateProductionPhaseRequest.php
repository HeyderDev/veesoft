<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProductionPhaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('planning.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'vivero_id' => 'required|integer|exists:viveros,id',
            'code' => [
                'required', 'string', 'max:50',
                Rule::unique('production_phases')->where('vivero_id', $this->input('vivero_id')),
            ],
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'execution_order' => 'required|integer|min:1',
            'estimated_duration_days' => 'required|integer|min:1',
            'color_reference' => 'nullable|string|max:30',
        ];
    }
}
