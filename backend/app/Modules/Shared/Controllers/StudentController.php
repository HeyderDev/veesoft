<?php

namespace App\Modules\Shared\Controllers;

use App\Modules\Shared\Models\Student;
use Illuminate\Http\Request;

class StudentController extends BaseApiController
{
    public function index(Request $request)
    {
        $search = $request->query('q');
        
        $query = Student::query();
        
        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }
        
        $students = $query->orderBy('name')->limit(50)->get();
        
        return $this->successResponse($students);
    }
}
