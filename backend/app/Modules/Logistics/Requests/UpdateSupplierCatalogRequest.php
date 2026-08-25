<?php

namespace App\Modules\Logistics\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'present|array',
            'items.*.item_type' => 'required|in:supply,tool',
            'items.*.item_id' => 'required|integer',
            'items.*.unit_price' => 'required|numeric|min:0',
        ];
    }

    /**
     * `item_id` no es único por sí solo: un Supply y un Tool pueden compartir el mismo
     * ID (son tablas independientes), así que la unicidad real del catálogo se valida
     * sobre el par (item_type, item_id), no sobre item_id aislado como haría `distinct`.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $pairs = collect($this->input('items', []))
                ->map(fn (array $item) => ($item['item_type'] ?? '').':'.($item['item_id'] ?? ''));

            if ($pairs->count() !== $pairs->unique()->count()) {
                $validator->errors()->add('items', 'No puedes repetir el mismo ítem en el catálogo.');
            }
        });
    }
}
