<?php

namespace App\Modules\Shared\Controllers;

use App\Modules\Shared\Services\UserService;
use Illuminate\Http\JsonResponse;

class UserController extends BaseApiController
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(): JsonResponse
    {
        return $this->successResponse($this->userService->getActiveForSelection());
    }
}
