<?php

namespace App\Modules\Synchronization\Requests;

use App\Modules\Synchronization\Enums\SyncOperation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReceiveSyncRequest extends FormRequest
{
    public function authorize(): bool
    {
        // El emisor es un nodo, no un usuario. El token se valida en SyncNodeService.
        return true;
    }

    public function rules(): array
    {
        return [
            'event_id' => ['required', 'uuid'],
            'entity_type' => ['required', 'string', 'max:100'],
            'entity_id' => ['required', 'string', 'max:64'],
            'operation' => ['required', Rule::enum(SyncOperation::class)],
            'occurred_at' => ['required', 'date'],
            'origin_node_id' => ['required', 'uuid'],
            'base_version' => ['required', 'integer', 'min:0'],
            'entity_version' => ['required', 'integer', 'gt:base_version'],
            'payload' => ['nullable', 'array'],
            'payload_hash' => ['required', 'string', 'size:64'],
        ];
    }
}
