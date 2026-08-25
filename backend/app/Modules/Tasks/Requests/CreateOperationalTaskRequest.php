<?php

namespace App\Modules\Tasks\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOperationalTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity_type_id' => 'nullable|exists:activity_types,id',
            // Si viene de una plantilla (activity_type_id), el título se copia
            // de la plantilla en OperationalTaskService::createTask() — solo es
            // obligatorio en el flujo "Libre".
            'title' => 'required_without:activity_type_id|nullable|string|max:150',
            'description' => 'nullable|string',
            'observations' => 'nullable|string',
            'priority' => 'nullable|string|max:30',
            'planned_date' => 'required|date',
            'lot_id' => 'nullable|exists:lots,id',
            'assigned_to' => 'nullable|exists:users,id',
            'resources' => 'nullable|array',
            'resources.*.type' => 'required_with:resources|in:tool,supply',
            'resources.*.id' => 'required_with:resources|integer',
            'resources.*.quantity' => 'nullable|numeric|min:0.01',
        ];
    }
}
