<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLotPositionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('planning.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'position_x' => 'required|numeric',
            'position_y' => 'required|numeric',
        ];
    }
}
