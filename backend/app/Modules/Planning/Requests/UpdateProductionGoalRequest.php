<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductionGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('planning.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'target_seedlings' => 'sometimes|integer|min:1',
        ];
    }
}
