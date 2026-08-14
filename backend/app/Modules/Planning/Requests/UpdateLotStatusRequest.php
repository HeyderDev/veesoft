<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLotStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('planning.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'current_status' => 'required|in:available,occupied,inactive',
        ];
    }
}
