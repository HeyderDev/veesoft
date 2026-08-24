<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vivero_id' => 'required|integer|exists:viveros,id',
            'code' => 'sometimes|nullable|string|max:50|unique:lots,code',
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('lots', 'name')->where(fn ($query) => $query->where('vivero_id', $this->input('vivero_id'))),
            ],
            'funda_diameter' => 'sometimes|numeric|min:1|max:50',
            'width' => 'required|numeric|min:0.1',
            'length' => 'required|numeric|min:0.1',
            'corridor_count' => 'required|integer|min:0',
            'corridor_width' => 'required_if:corridor_count,>0|numeric|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
