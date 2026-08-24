<?php

namespace App\Modules\Planning\Requests;

use App\Modules\Planning\Models\Lot;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $lotId = $this->route('lot');
        $viveroId = Lot::find($lotId)?->vivero_id;

        return [
            'name' => [
                'sometimes', 'string', 'max:100',
                Rule::unique('lots', 'name')
                    ->where(fn ($query) => $query->where('vivero_id', $viveroId))
                    ->ignore($lotId),
            ],
            'notes' => 'nullable|string',
        ];
    }
}
