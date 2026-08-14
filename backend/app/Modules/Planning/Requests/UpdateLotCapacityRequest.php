<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLotCapacityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('planning.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'total_capacity' => 'required|integer|min:1',
        ];
    }
}
