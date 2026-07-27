<?php

namespace App\Modules\Tracking\Requests;

use App\Modules\Tracking\Models\TrackingItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTrackingItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:150',
            'species' => 'sometimes|string|max:100',
            'stage' => ['sometimes', Rule::in([
                TrackingItem::STAGE_GERMINATION,
                TrackingItem::STAGE_NURSERY,
                TrackingItem::STAGE_TRANSPLANT,
                TrackingItem::STAGE_READY_FOR_DISPATCH,
            ])],
            'unit' => 'sometimes|string|max:20',
            'location' => 'sometimes|string|max:150',
            'minimum_stock' => 'sometimes|integer|min:0',
            'notes' => 'nullable|string',
        ];
    }
}
