<?php

namespace App\Http\Middleware;

use App\Modules\Planning\Models\Vivero;
use App\Modules\Shared\Support\CurrentVivero;
use Closure;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resuelve el vivero activo de la request a partir del header X-Vivero-Id,
 * lo valida y lo deja disponible en CurrentVivero para el resto del ciclo
 * de vida de la request (global scope de BelongsToVivero, controladores, etc).
 */
class ResolveViveroContext
{
    public function __construct(private CurrentVivero $currentVivero)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('X-Vivero-Id');

        if ($header === null || ! ctype_digit((string) $header)) {
            throw ValidationException::withMessages([
                'X-Vivero-Id' => 'El encabezado X-Vivero-Id es requerido y debe ser un identificador numérico.',
            ]);
        }

        if (! Vivero::whereKey((int) $header)->exists()) {
            throw new ModelNotFoundException('Vivero no encontrado.');
        }

        $this->currentVivero->set((int) $header);

        return $next($request);
    }
}
