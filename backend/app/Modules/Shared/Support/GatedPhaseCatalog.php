<?php

namespace App\Modules\Shared\Support;

/**
 * Las 3 fases del ciclo que son, en la práctica, actividades obligatorias:
 * Siembra, Injertación y Despacho. Un lote no puede considerarse superado en
 * ninguna de estas fases hasta que la OperationalTask (Tasks) vinculada a su
 * ActivityType de sistema correspondiente esté completada — ver
 * LotCycleService::computeCurrentPhase() y OperationalTaskService::completeTask().
 *
 * Fuente única de verdad del mapeo ProductionPhase.code <-> ActivityType.system_code
 * para que Planning y Tasks no dupliquen este acoplamiento cada uno por su lado.
 */
final class GatedPhaseCatalog
{
    public const CODES = ['SIEM', 'INJER', 'DESP'];

    public const SYSTEM_ACTIVITY_CODE = [
        'SIEM' => 'SEEDING',
        'INJER' => 'GRAFTING',
        'DESP' => 'DISPATCH',
    ];

    public static function isGated(string $phaseCode): bool
    {
        return in_array($phaseCode, self::CODES, true);
    }

    public static function activityCodeFor(string $phaseCode): ?string
    {
        return self::SYSTEM_ACTIVITY_CODE[$phaseCode] ?? null;
    }

    public static function phaseCodeForActivity(string $activityCode): ?string
    {
        return array_search($activityCode, self::SYSTEM_ACTIVITY_CODE, true) ?: null;
    }
}
