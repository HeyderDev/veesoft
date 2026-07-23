<?php

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

                // Tratar errores de validación
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Error de validación',
                        'errors' => $e->errors(),
                    ], 422);
                }

                // Modelo no encontrado
                if ($e instanceof ModelNotFoundException) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Recurso no encontrado',
                    ], 404);
                }

                // Regla de negocio violada (cualquier módulo puede lanzar \DomainException
                // desde su Service; el Controller no necesita capturarla manualmente).
                if ($e instanceof DomainException) {
                    return response()->json([
                        'status' => 'error',
                        'message' => $e->getMessage(),
                        'data' => null,
                    ], 409);
                }

                // Excepciones genéricas
                return response()->json([
                    'status' => 'error',
                    'message' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor',
                    'data' => null,
                ], $statusCode);
            }
        });
    })->create();
