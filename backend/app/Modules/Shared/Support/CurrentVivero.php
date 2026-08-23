<?php

namespace App\Modules\Shared\Support;

/**
 * Contenedor del vivero activo de la request actual. Lo resuelve
 * ResolveViveroContext a partir del header X-Vivero-Id; lo consumen
 * BelongsToVivero (global scope + autofill) y cualquier controlador/servicio
 * que necesite saber para qué vivero está trabajando.
 */
class CurrentVivero
{
    private ?int $id = null;

    public function set(int $id): void
    {
        $this->id = $id;
    }

    public function id(): ?int
    {
        return $this->id;
    }

    public function hasVivero(): bool
    {
        return $this->id !== null;
    }
}
