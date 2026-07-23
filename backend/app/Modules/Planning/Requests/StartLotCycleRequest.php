<?php

namespace App\Modules\Planning\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartLotCycleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'started_at' => 'required|date',
            'starting_phase_id' => 'sometimes|nullable|integer|exists:production_phases,id',
        ];
    }
}
