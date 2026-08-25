<?php

namespace App\Modules\Shared\Controllers;

use App\Modules\Shared\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Laravel\Sanctum\TransientToken;

class AuthController extends BaseApiController
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);
        // El autocompletado de algunos teclados/gestores de contraseñas en
        // Android agrega espacios al final — eso rompe el match exacto y se
        // ve idéntico a una contraseña mal escrita.
        $credentials['email'] = trim($credentials['email']);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Auth::guard('web')->validate($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'Las credenciales no son válidas.',
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => 'El usuario está inactivo.',
            ]);
        }

        // La web (mismo origen que el backend, vía el proxy de Vite en dev)
        // usa sesión por cookie de Sanctum SPA — EnsureFrontendRequestsAreStateful
        // ya decidió si esta petición cuenta como "de la SPA" según
        // SANCTUM_STATEFUL_DOMAINS. La app móvil empaquetada vive en un origen
        // cross-site real (WebView), donde una cookie SameSite=Lax nunca se
        // reenvía sola en peticiones AJAX — para ese caso no hay sesión
        // viable, así que se le entrega un token Bearer en su lugar.
        $token = null;
        if (EnsureFrontendRequestsAreStateful::fromFrontend($request)) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        } else {
            $token = $user->createToken('mobile')->plainTextToken;
        }

        $payload = $user->load('role')->toArray();
        $payload['token'] = $token;

        return $this->successResponse($payload, 'Sesión iniciada');
    }

    public function logout(Request $request)
    {
        $currentToken = $request->user()?->currentAccessToken();

        if ($currentToken instanceof TransientToken) {
            // Sesión por cookie (web): así representa Sanctum una sesión
            // "stateful" cuando se le pide el token actual.
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } else {
            // Token Bearer real (app móvil): se revoca solo ese token, no
            // afecta otras sesiones/dispositivos del mismo usuario.
            $currentToken?->delete();
        }

        return $this->successResponse(null, 'Sesión cerrada');
    }

    public function me(Request $request)
    {
        return $this->successResponse($request->user()->load('role'));
    }
}
