<?php

namespace App\Modules\Tracking\Requests;

use App\Modules\Tracking\Models\TrackingMovement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTrackingMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tracking_item_id' => 'required|integer|exists:tracking_items,id',
            'type' => ['required', Rule::in([TrackingMovement::TYPE_ENTRY, TrackingMovement::TYPE_EXIT])],
            'quantity' => 'required|integer|min:1',
            'movement_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }
}
