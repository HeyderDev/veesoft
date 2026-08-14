<?php

namespace Database\Seeders;

use App\Modules\Synchronization\Models\SyncNode;
use Illuminate\Database\Seeder;

class SyncNodeSeeder extends Seeder
{
    public function run(): void
    {
        $local = config('synchronization.local_node');
        $target = config('synchronization.default_target');

        SyncNode::updateOrCreate(
            ['id' => $local['id']],
            [
                'code' => $local['code'],
                'name' => $local['name'],
                'node_type' => $local['type'],
                'is_active' => true,
            ],
        );

        if ($target['id'] !== $local['id']) {
            SyncNode::updateOrCreate(
                ['id' => $target['id']],
                [
                    'code' => $target['code'],
                    'name' => $target['name'],
                    'node_type' => $target['type'],
                    'base_url' => $target['url'],
                    'is_active' => true,
                ],
            );
        }
    }
}
