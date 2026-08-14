<?php

namespace App\Providers;

use App\Modules\Inventory\Repositories\Contracts\MovementRepositoryInterface;
use App\Modules\Inventory\Repositories\Contracts\SupplyRepositoryInterface;
use App\Modules\Inventory\Repositories\Contracts\ToolRepositoryInterface;
use App\Modules\Inventory\Repositories\Eloquent\MovementRepository;
use App\Modules\Inventory\Repositories\Eloquent\SupplyRepository;
use App\Modules\Inventory\Repositories\Eloquent\ToolRepository;
use App\Modules\Logistics\Repositories\Contracts\PurchaseOrderRepositoryInterface;
use App\Modules\Logistics\Repositories\Contracts\PurchaseRequestRepositoryInterface;
use App\Modules\Logistics\Repositories\Contracts\SupplierRepositoryInterface;
use App\Modules\Logistics\Repositories\Eloquent\PurchaseOrderRepository;
use App\Modules\Logistics\Repositories\Eloquent\PurchaseRequestRepository;
use App\Modules\Logistics\Repositories\Eloquent\SupplierRepository;
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
use App\Modules\Shared\Enums\PermissionCode;
use App\Modules\Shared\Models\User;
use App\Modules\Shared\Policies\PermissionPolicy;
use App\Modules\Shared\Repositories\Contracts\AuditLogRepositoryInterface;
use App\Modules\Shared\Repositories\Contracts\UserRepositoryInterface;
use App\Modules\Shared\Repositories\Eloquent\AuditLogRepository;
use App\Modules\Shared\Repositories\Eloquent\UserRepository;
use App\Modules\Synchronization\Commands\RegisterSyncNodeCommand;
use App\Modules\Synchronization\Commands\RunSynchronizationCommand;
use App\Modules\Synchronization\Events\SyncableDomainEvent;
use App\Modules\Synchronization\Listeners\QueueSyncableDomainEvent;
use App\Modules\Synchronization\Repositories\Contracts\SyncConflictRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncEntityStateRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncNodeRepositoryInterface;
use App\Modules\Synchronization\Repositories\Contracts\SyncQueueRepositoryInterface;
use App\Modules\Synchronization\Repositories\Eloquent\SyncConflictRepository;
use App\Modules\Synchronization\Repositories\Eloquent\SyncEntityStateRepository;
use App\Modules\Synchronization\Repositories\Eloquent\SyncNodeRepository;
use App\Modules\Synchronization\Repositories\Eloquent\SyncQueueRepository;
use App\Modules\Synchronization\Services\SyncEntityRegistry;
use App\Modules\Synchronization\Services\SynchronizationContext;
use App\Modules\Tasks\Repositories\Contracts\OperationalTaskRepositoryInterface;
use App\Modules\Tasks\Repositories\Eloquent\OperationalTaskRepository;
use App\Modules\Tracking\Repositories\Contracts\DispatchReportRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingClientRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingLotRepositoryInterface;
use App\Modules\Tracking\Repositories\Contracts\TrackingMovementRepositoryInterface;
use App\Modules\Tracking\Repositories\Eloquent\DispatchReportRepository;
use App\Modules\Tracking\Repositories\Eloquent\TrackingClientRepository;
use App\Modules\Tracking\Repositories\Eloquent\TrackingLotRepository;
use App\Modules\Tracking\Repositories\Eloquent\TrackingMovementRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
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
        $this->app->bind(AuditLogRepositoryInterface::class, AuditLogRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);

        // ---- Módulo Synchronization ----
        $this->app->bind(SyncNodeRepositoryInterface::class, SyncNodeRepository::class);
        $this->app->bind(SyncQueueRepositoryInterface::class, SyncQueueRepository::class);
        $this->app->bind(SyncEntityStateRepositoryInterface::class, SyncEntityStateRepository::class);
        $this->app->bind(SyncConflictRepositoryInterface::class, SyncConflictRepository::class);
        $this->app->singleton(SyncEntityRegistry::class);
        $this->app->singleton(SynchronizationContext::class);

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
        $this->app->bind(TrackingLotRepositoryInterface::class, TrackingLotRepository::class);
        $this->app->bind(TrackingMovementRepositoryInterface::class, TrackingMovementRepository::class);
        $this->app->bind(TrackingClientRepositoryInterface::class, TrackingClientRepository::class);

        // ---- Módulo Inventory ----
        $this->app->bind(ToolRepositoryInterface::class, ToolRepository::class);
        $this->app->bind(SupplyRepositoryInterface::class, SupplyRepository::class);
        $this->app->bind(MovementRepositoryInterface::class, MovementRepository::class);

        // ---- Módulo Tasks ----
        $this->app->bind(OperationalTaskRepositoryInterface::class, OperationalTaskRepository::class);

        // ---- Módulo Logistics ----
        $this->app->bind(SupplierRepositoryInterface::class, SupplierRepository::class);
        $this->app->bind(PurchaseOrderRepositoryInterface::class, PurchaseOrderRepository::class);
        $this->app->bind(PurchaseRequestRepositoryInterface::class, PurchaseRequestRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191);

        Event::listen(
            SyncableDomainEvent::class,
            QueueSyncableDomainEvent::class,
        );

        RateLimiter::for(
            'sync',
            fn (Request $request) => Limit::perMinute(120)->by($request->ip())
        );

        if ($this->app->runningInConsole()) {
            $this->commands([
                RegisterSyncNodeCommand::class,
                RunSynchronizationCommand::class,
            ]);
        }

        $permissionPolicy = $this->app->make(PermissionPolicy::class);
        foreach (PermissionCode::cases() as $permission) {
            Gate::define(
                $permission->value,
                fn (User $user): bool => $permissionPolicy->allows($user, $permission)
            );
        }

        // Los modelos viven en App\Modules\{Module}\Models, no en App\Models,
        // por lo que Laravel no puede adivinar su Factory por convención.
        // Esta regla la resuelve por nombre de clase (LotFactory sirve a Lot
        // sin importar en qué módulo esté), y aplica a todos los módulos.
        Factory::guessFactoryNamesUsing(
            fn (string $modelName) => 'Database\\Factories\\'.class_basename($modelName).'Factory'
        );
    }
}
