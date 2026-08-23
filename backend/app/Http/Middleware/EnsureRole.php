<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe una ruta a un rol específico (ej. Route::middleware('role:Admin')).
 * Se aplica siempre después de `auth:sanctum` — asume que ya hay un usuario
 * autenticado en la request.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user || ! $user->role || $user->role->name !== $role) {
            abort(403, 'No tienes permiso para realizar esta acción.');
        }

        return $next($request);
    }
}
