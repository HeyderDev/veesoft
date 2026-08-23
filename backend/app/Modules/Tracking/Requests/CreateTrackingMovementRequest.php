<?php

namespace App\Modules\Tracking\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTrackingMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lot_id' => 'required|integer|exists:lots,id',
            'tracking_client_id' => 'required|integer|exists:tracking_clients,id',
            'quantity' => 'required|integer|min:1',
            'movement_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }
}
