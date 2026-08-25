<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Retira la funcionalidad de Solicitud de aprovisionamiento (PurchaseRequest):
     * ya no tiene consumidor (el flujo real es que Admin crea la PurchaseOrder
     * directamente) — ver docs/03_MODULE_CONTRACTS/Logistics.md.
     */
    public function up(): void
    {
        Schema::dropIfExists('purchase_request_items');
        Schema::dropIfExists('purchase_requests');
    }

    public function down(): void
    {
        // No se recrea: la funcionalidad se retiró deliberadamente, no es un rollback
        // de una migración fallida. Restaurarla implica volver a traer las migraciones
        // originales (2026_07_25_000600/700, 2026_08_23_000006/102000) desde el historial de git.
    }
};
