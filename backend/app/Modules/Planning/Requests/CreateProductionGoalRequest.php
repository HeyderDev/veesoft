<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductionGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vivero_id' => 'required|integer|exists:viveros,id',
            'title' => 'required|string|max:150',
            'description' => 'nullable|string',
            'target_seedlings' => 'required|integer|min:1',
        ];
    }
}
