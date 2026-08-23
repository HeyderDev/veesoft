<?php

namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Requests\CreateStudentRequest;
use App\Modules\Inventory\Requests\ImportStudentsRequest;
use App\Modules\Inventory\Requests\UpdateStudentRequest;
use App\Modules\Inventory\Services\StudentService;
use App\Modules\Shared\Controllers\BaseApiController;
use Illuminate\Http\Request;

class StudentController extends BaseApiController
{
    public function __construct(
        private StudentService $studentService
    ) {}

    public function index(Request $request)
    {
        $search = $request->query('q');
        $status = $request->query('status');
        $career = $request->query('career');
        $semester = $request->query('semester');
        
        $students = $this->studentService->listStudents(15, $search, $status, $career, $semester);

        return $this->paginatedResponse($students, 'Estudiantes obtenidos exitosamente');
    }

    public function store(CreateStudentRequest $request)
    {
        $student = $this->studentService->createStudent($request->validated());
        return $this->createdResponse($student, 'Estudiante registrado exitosamente');
    }

    public function show(int $studentId)
    {
        $student = $this->studentService->getDetail($studentId);
        return $this->successResponse($student);
    }

    public function update(UpdateStudentRequest $request, int $studentId)
    {
        $updated = $this->studentService->updateStudent($studentId, $request->validated());
        return $this->successResponse($updated, 'Estudiante actualizado exitosamente');
    }

    public function updateStatus(Request $request, int $studentId)
    {
        $request->validate(['status' => 'required|in:active,inactive']);
        $updated = $this->studentService->updateStatus($studentId, $request->status);
        return $this->successResponse($updated, 'Estado actualizado');
    }

    public function importCsv(ImportStudentsRequest $request)
    {
        $result = $this->studentService->importStudents($request->validated('students'));
        return $this->successResponse($result, 'Proceso de importación finalizado');
    }
}
