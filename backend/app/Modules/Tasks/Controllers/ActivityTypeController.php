<?php

namespace App\Modules\Tasks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Models\ActivityType;
use App\Modules\Tasks\Models\ActivityTypeResource;
use Illuminate\Http\Request;

class ActivityTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $viveroId = request()->header('X-Vivero-ID');
        $query = ActivityType::with('resources');

        if ($viveroId) {
            $query->where(function ($q) use ($viveroId) {
                $q->where('vivero_id', $viveroId)
                  ->orWhere('is_system', true);
            });
        } else {
            $query->where('is_system', true);
        }

        return response()->json($query->orderBy('name')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $viveroId = request()->header('X-Vivero-ID');

        $validated = $request->validate($this->rules());

        $activityType = ActivityType::create([
            'vivero_id' => $viveroId,
            'is_system' => false, // Solo el sistema puede crear is_system=true a través de seeders
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'default_priority' => $validated['default_priority'] ?? 'normal',
        ]);

        $this->syncResources($activityType, $validated['resources'] ?? []);

        return response()->json($activityType->load('resources'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $activityType = ActivityType::with('resources')->findOrFail($id);
        return response()->json($activityType);
    }

    /**
     * Update the specified resource in storage.
     *
     * Las plantillas del sistema (Siembra/Injerto/Despacho) sí se pueden
     * editar — solo el `system_code` queda inmutable, y solo se puede
     * eliminar una plantilla que no sea del sistema (ver destroy()).
     */
    public function update(Request $request, string $id)
    {
        $activityType = ActivityType::findOrFail($id);

        $validated = $request->validate($this->rules(sometimes: true));

        $activityType->update([
            'name' => $validated['name'] ?? $activityType->name,
            'description' => array_key_exists('description', $validated) ? $validated['description'] : $activityType->description,
            'default_priority' => $validated['default_priority'] ?? $activityType->default_priority,
        ]);

        if (array_key_exists('resources', $validated)) {
            $this->syncResources($activityType, $validated['resources'] ?? []);
        }

        return response()->json($activityType->load('resources'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $activityType = ActivityType::findOrFail($id);

        if ($activityType->is_system) {
            return response()->json(['message' => 'No se puede eliminar un tipo de actividad del sistema'], 403);
        }

        $activityType->delete();

        return response()->json(null, 204);
    }

    private function rules(bool $sometimes = false): array
    {
        $prefix = $sometimes ? 'sometimes|required|' : 'required|';

        return [
            'name' => $prefix.'string|max:150',
            'description' => 'nullable|string',
            'default_priority' => 'nullable|string|max:30',
            'resources' => 'nullable|array',
            'resources.*.type' => 'required_with:resources|in:tool,supply',
            'resources.*.id' => 'required_with:resources|integer',
            'resources.*.quantity' => 'nullable|numeric|min:0.01',
        ];
    }

    private function syncResources(ActivityType $activityType, array $resources): void
    {
        ActivityTypeResource::where('activity_type_id', $activityType->id)->delete();

        foreach ($resources as $resource) {
            if (! empty($resource['type']) && ! empty($resource['id'])) {
                ActivityTypeResource::create([
                    'activity_type_id' => $activityType->id,
                    'resource_type' => $resource['type'],
                    'resource_id' => $resource['id'],
                    'quantity' => $resource['quantity'] ?? 1,
                ]);
            }
        }
    }
}
