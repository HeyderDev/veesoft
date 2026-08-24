<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class StudentController extends Controller
{
    /**
     * Valida una cédula ecuatoriana usando el algoritmo Módulo 10.
     */
    private function validateCedula($cedula)
    {
        if (strlen($cedula) !== 10 || !is_numeric($cedula)) {
            return false;
        }

        $provincia = (int) substr($cedula, 0, 2);
        if ($provincia < 1 || $provincia > 24) {
            return false;
        }

        $tercerDigito = (int) $cedula[2];
        if ($tercerDigito >= 6) {
            return false; // Solo cédulas de personas naturales (tercer dígito < 6)
        }

        $coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        $suma = 0;

        for ($i = 0; $i < 9; $i++) {
            $valor = (int) $cedula[$i] * $coeficientes[$i];
            if ($valor > 9) {
                $valor -= 9;
            }
            $suma += $valor;
        }

        $decenaSuperior = ceil($suma / 10) * 10;
        $digitoVerificadorCalculado = (int) ($decenaSuperior - $suma);
        if ($digitoVerificadorCalculado == 10) {
            $digitoVerificadorCalculado = 0;
        }

        $digitoVerificadorReal = (int) $cedula[9];

        return $digitoVerificadorCalculado === $digitoVerificadorReal;
    }

    public function index(Request $request)
    {
        $viveroId = $request->header('X-Vivero-ID');
        if (!$viveroId) {
            return response()->json(['message' => 'X-Vivero-ID header is required'], 400);
        }

        $query = Student::where('vivero_id', $viveroId)
            ->withCount([
                'movements as total_borrows' => function ($query) {
                    $query->whereIn('type', ['BORROWED', 'BORROW']);
                },
                'movements as total_returns' => function ($query) {
                    $query->where('type', 'RETURN');
                }
            ])
            ->latest();

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "%{$search}%");
            });
        }

        $students = $query->get();

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $viveroId = $request->header('X-Vivero-ID');
        if (!$viveroId) {
            return response()->json(['message' => 'X-Vivero-ID header is required'], 400);
        }

        $request->validate([
            'cedula' => 'required|string|size:10',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'career' => 'nullable|string|max:255',
            'semester' => 'nullable|string|max:255',
        ]);

        if (!$this->validateCedula($request->cedula)) {
            throw ValidationException::withMessages([
                'cedula' => ['La cédula ingresada no es válida para Ecuador.']
            ]);
        }

        // Check if cedula exists in this vivero
        $exists = Student::where('vivero_id', $viveroId)->where('cedula', $request->cedula)->exists();
        if ($exists) {
            throw ValidationException::withMessages([
                'cedula' => ['Esta cédula ya se encuentra registrada en este vivero.']
            ]);
        }

        $student = Student::create([
            'vivero_id' => $viveroId,
            'cedula' => $request->cedula,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'career' => $request->career,
            'semester' => $request->semester,
        ]);

        return response()->json($student, 201);
    }

    public function update(Request $request, $id)
    {
        $viveroId = $request->header('X-Vivero-ID');
        $student = Student::where('vivero_id', $viveroId)->findOrFail($id);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'career' => 'nullable|string|max:255',
            'semester' => 'nullable|string|max:255',
        ]);

        $student->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'career' => $request->career,
            'semester' => $request->semester,
        ]);

        return response()->json($student);
    }

    public function destroy(Request $request, $id)
    {
        $viveroId = $request->header('X-Vivero-ID');
        $student = Student::where('vivero_id', $viveroId)->findOrFail($id);
        
        $student->delete();

        return response()->json(['message' => 'Estudiante eliminado correctamente']);
    }

    public function searchByCedula(Request $request, $cedula)
    {
        $viveroId = $request->header('X-Vivero-ID');
        if (!$viveroId) {
            return response()->json(['message' => 'X-Vivero-ID header is required'], 400);
        }

        $student = Student::where('vivero_id', $viveroId)
            ->where('cedula', $cedula)
            ->first();

        if (!$student) {
            return response()->json(['message' => 'Estudiante no encontrado'], 404);
        }

        return response()->json($student);
    }

    public function importCsv(Request $request)
    {
        $viveroId = $request->header('X-Vivero-ID');
        if (!$viveroId) {
            return response()->json(['message' => 'X-Vivero-ID header is required'], 400);
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120', // Max 5MB
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));

        if (count($data) < 2) {
            return response()->json(['message' => 'El archivo está vacío o no tiene encabezados válidos.'], 400);
        }

        $header = array_shift($data);
        // Esperamos: Nombre, Apellido, Cedula, Carrera, Semestre
        
        $insertedCount = 0;
        $errors = [];

        foreach ($data as $index => $row) {
            $rowNumber = $index + 2; // +1 for 0-index, +1 for header

            if (count($row) < 3) {
                $errors[] = "Fila {$rowNumber}: Formato incorrecto. Faltan datos.";
                continue;
            }

            $firstName = trim($row[0] ?? '');
            $lastName = trim($row[1] ?? '');
            $cedula = trim($row[2] ?? '');
            $career = trim($row[3] ?? '');
            $semester = trim($row[4] ?? '');

            if (empty($firstName) || empty($lastName) || empty($cedula)) {
                $errors[] = "Fila {$rowNumber}: Nombre, Apellido y Cédula son obligatorios.";
                continue;
            }

            if (!$this->validateCedula($cedula)) {
                $errors[] = "Fila {$rowNumber}: La cédula '{$cedula}' no es válida.";
                continue;
            }

            $exists = Student::where('vivero_id', $viveroId)->where('cedula', $cedula)->exists();
            if ($exists) {
                // Opción: Actualizar si existe, o solo ignorar
                $errors[] = "Fila {$rowNumber}: La cédula '{$cedula}' ya está registrada.";
                continue;
            }

            Student::create([
                'vivero_id' => $viveroId,
                'cedula' => $cedula,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'career' => $career,
                'semester' => $semester,
            ]);

            $insertedCount++;
        }

        return response()->json([
            'message' => "Importación completada.",
            'inserted' => $insertedCount,
            'errors' => $errors
        ]);
    }
}
