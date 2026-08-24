<?php

namespace App\Modules\Shared\Controllers;

use App\Modules\Shared\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseApiController
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Auth::guard('web')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'Las credenciales no son válidas.',
            ]);
        }

        if ($user->status !== 'active') {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'email' => 'El usuario está inactivo.',
            ]);
        }

        $request->session()->regenerate();

        return $this->successResponse($user->load('role'), 'Sesión iniciada');
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->successResponse(null, 'Sesión cerrada');
    }

    public function me(Request $request)
    {
        return $this->successResponse($request->user()->load('role'));
    }
}
