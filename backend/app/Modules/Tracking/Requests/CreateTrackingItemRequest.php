<?php

namespace App\Modules\Tracking\Requests;

use App\Modules\Tracking\Models\TrackingItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTrackingItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:150',
            'species' => 'required|string|max:100',
            'stage' => ['required', Rule::in([
                TrackingItem::STAGE_GERMINATION,
                TrackingItem::STAGE_NURSERY,
                TrackingItem::STAGE_TRANSPLANT,
                TrackingItem::STAGE_READY_FOR_DISPATCH,
            ])],
            'quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:20',
            'location' => 'required|string|max:150',
            'minimum_stock' => 'required|integer|min:0',
            'notes' => 'nullable|string',
            'registered_at' => 'nullable|date',
        ];
    }
}
