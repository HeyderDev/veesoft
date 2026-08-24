<?php

namespace App\Modules\Tasks\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Models\ActivityType;
use Illuminate\Http\Request;

class ActivityTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $viveroId = request()->header('X-Vivero-ID');
        $query = ActivityType::query();

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
        
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
        ]);

        $validated['vivero_id'] = $viveroId;
        $validated['is_system'] = false; // Solo el sistema puede crear is_system=true a través de seeders

        $activityType = ActivityType::create($validated);

        return response()->json($activityType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $activityType = ActivityType::findOrFail($id);
        return response()->json($activityType);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $activityType = ActivityType::findOrFail($id);
        
        if ($activityType->is_system) {
            return response()->json(['message' => 'No se puede modificar un tipo de actividad del sistema'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
        ]);

        $activityType->update($validated);

        return response()->json($activityType);
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
}
