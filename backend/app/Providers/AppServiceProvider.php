<?php

namespace App\Providers;

use App\Modules\Planning\Repositories\Contracts\DispatchRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\LotCycleRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\LotRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ProductionGoalRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ProductionPhaseRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\SummaryRepositoryInterface;
use App\Modules\Planning\Repositories\Contracts\ViveroRepositoryInterface;
use App\Modules\Planning\Repositories\Eloquent\DispatchRepository;
use App\Modules\Planning\Repositories\Eloquent\LotCycleRepository;
use App\Modules\Planning\Repositories\Eloquent\LotRepository;
use App\Modules\Planning\Repositories\Eloquent\ProductionGoalRepository;
use App\Modules\Planning\Repositories\Eloquent\ProductionPhaseRepository;
use App\Modules\Planning\Repositories\Eloquent\SummaryRepository;
use App\Modules\Planning\Repositories\Eloquent\ViveroRepository;
use App\Modules\Tracking\Repositories\Contracts\DispatchReportRepositoryInterface;
use App\Modules\Tracking\Repositories\Eloquent\DispatchReportRepository;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * Cada módulo registra aquí (o en su propio Provider) el binding
     * entre sus interfaces de Repository y su implementación Eloquent.
     */
    public function register(): void
    {
        // ---- Módulo Planning ----
        $this->app->bind(ViveroRepositoryInterface::class, ViveroRepository::class);
        $this->app->bind(ProductionGoalRepositoryInterface::class, ProductionGoalRepository::class);
        $this->app->bind(ProductionPhaseRepositoryInterface::class, ProductionPhaseRepository::class);
        $this->app->bind(LotRepositoryInterface::class, LotRepository::class);
        $this->app->bind(LotCycleRepositoryInterface::class, LotCycleRepository::class);
        $this->app->bind(DispatchRepositoryInterface::class, DispatchRepository::class);
        $this->app->bind(SummaryRepositoryInterface::class, SummaryRepository::class);

        // ---- Módulo Tracking ----
        $this->app->bind(DispatchReportRepositoryInterface::class, DispatchReportRepository::class);

        // ---- Módulo Inventory ----
        $this->app->bind(\App\Modules\Inventory\Repositories\Contracts\ToolRepositoryInterface::class, \App\Modules\Inventory\Repositories\Eloquent\ToolRepository::class);
        $this->app->bind(\App\Modules\Inventory\Repositories\Contracts\SupplyRepositoryInterface::class, \App\Modules\Inventory\Repositories\Eloquent\SupplyRepository::class);
        $this->app->bind(\App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface::class, \App\Modules\Inventory\Repositories\Eloquent\MovementRepository::class);

        // ---- Módulo Tasks ----
        $this->app->bind(\App\Modules\Tasks\Repositories\Contracts\OperationalTaskRepositoryInterface::class, \App\Modules\Tasks\Repositories\Eloquent\OperationalTaskRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Los modelos viven en App\Modules\{Module}\Models, no en App\Models,
        // por lo que Laravel no puede adivinar su Factory por convención.
        // Esta regla la resuelve por nombre de clase (LotFactory sirve a Lot
        // sin importar en qué módulo esté), y aplica a todos los módulos.
        Factory::guessFactoryNamesUsing(
            fn (string $modelName) => 'Database\\Factories\\'.class_basename($modelName).'Factory'
        );
    }
}
