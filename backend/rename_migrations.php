<?php

$dir = 'database/migrations';
$order = [
    'roles', 'users', 'production_goals', 'production_plans',
    'production_cycles', 'lots', 'production_phases', 'cycle_lots',
    'cycle_lot_phases', 'reschedules', 'climate_events',
    'climate_event_lots', 'alerts', 'operational_tasks',
    'dispatches', 'production_histories', 'nursery_layouts',
    'lot_positions', 'dashboard_metrics',
];

$files = scandir($dir);

foreach ($order as $i => $name) {
    foreach ($files as $file) {
        if (strpos($file, $name.'_table') !== false) {
            $num = str_pad($i, 2, '0', STR_PAD_LEFT);
            $prefix = "2026_01_01_00{$num}00";
            rename("$dir/$file", "$dir/{$prefix}_create_{$name}_table.php");
            echo "Renamed $file to {$prefix}_create_{$name}_table.php\n";
            break;
        }
    }
}
