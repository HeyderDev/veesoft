<?php

namespace App\Modules\Shared\Controllers;

use App\Modules\Shared\Models\User;
use App\Modules\Shared\Requests\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends BaseApiController
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->safe()->only(['email', 'password']);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            return $this->errorResponse('Las credenciales ingresadas no son válidas.', 422);
        }

        /** @var User $user */
        $user = $request->user();

        if ($user->status !== 'active') {
            Auth::logout();

            return $this->errorResponse('La cuenta de usuario está inactiva.', 403);
        }

        $request->session()->regenerate();

        return $this->successResponse(
            $this->authenticatedUser($user),
            'Sesión iniciada correctamente.'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::forgetGuards();

        return $this->successResponse(null, 'Sesión cerrada correctamente.');
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->successResponse($this->authenticatedUser($user));
    }

    /**
     * @return array<string, mixed>
     */
    private function authenticatedUser(User $user): array
    {
        $user->loadMissing('role.permissions');

        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'permissions' => $user->role->permissions->pluck('code')->values()->all(),
            ] : null,
        ];
    }
}
