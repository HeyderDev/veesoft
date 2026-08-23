<?php

namespace App\Modules\Inventory\Services;


use App\Modules\Inventory\Repositories\Contracts\StudentRepositoryInterface;
use App\Modules\Shared\Services\BaseService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StudentService extends BaseService
{
    public function __construct(
        private StudentRepositoryInterface $studentRepository
    ) {
        parent::__construct($studentRepository);
    }

    public function listStudents(int $perPage = 15, ?string $search = null, ?string $status = null, ?string $career = null, ?int $semester = null)
    {
        return $this->studentRepository->paginateStudents($perPage, $search, $status, $career, $semester);
    }

    public function createStudent(array $data)
    {
        return $this->studentRepository->create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'cedula' => $data['cedula'],
            'career' => $data['career'],
            'semester' => $data['semester'],
            'status' => $data['status'] ?? 'active',
        ]);
    }

    public function updateStudent(int $id, array $data)
    {
        return $this->studentRepository->update($id, [
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'cedula' => $data['cedula'],
            'career' => $data['career'],
            'semester' => $data['semester'],
            'status' => $data['status'],
        ]);
    }

    public function updateStatus(int $id, string $status)
    {
        return $this->studentRepository->update($id, ['status' => $status]);
    }

    public function importStudents(array $studentsData)
    {
        $importedCount = 0;
        $errors = [];

        DB::transaction(function () use ($studentsData, &$importedCount, &$errors) {
            foreach ($studentsData as $index => $row) {
                // Validación individual por fila
                $validator = Validator::make($row, [
                    'nombre' => 'required|string|min:2|max:100',
                    'apellido' => 'required|string|min:2|max:100',
                    'cedula' => 'required|string|size:10',
                    'carrera' => 'required|string',
                    'semestre' => 'required|integer|min:1|max:10',
                ]);

                if ($validator->fails()) {
                    $errors[] = [
                        'fila' => $index + 2, // asumiendo cabecera en fila 1
                        'cedula' => $row['cedula'] ?? 'N/A',
                        'error' => implode(', ', $validator->errors()->all()),
                        'row_data' => $row
                    ];
                    continue;
                }
                $existing = $this->studentRepository->findByCedula($row['cedula']);
                if ($existing) {
                    $errors[] = [
                        'fila' => $index + 2, // asumiendo cabecera en fila 1
                        'cedula' => $row['cedula'],
                        'error' => 'La cédula ya está registrada en el sistema.',
                        'row_data' => $row
                    ];
                    continue;
                }

                // Guardar la carrera como texto simple
                $career = trim($row['carrera']);

                $this->studentRepository->create([
                    'first_name' => $row['nombre'],
                    'last_name' => $row['apellido'],
                    'cedula' => $row['cedula'],
                    'career' => $career,
                    'semester' => $row['semestre'],
                    'status' => 'active',
                ]);

                $importedCount++;
            }
        });

        return [
            'imported' => $importedCount,
            'errors' => $errors
        ];
    }
}
