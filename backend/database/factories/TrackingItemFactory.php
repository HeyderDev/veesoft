<?php

namespace Database\Factories;

use App\Modules\Tracking\Models\TrackingItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrackingItem>
 */
class TrackingItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Lote '.fake()->unique()->numberBetween(1, 9999),
            'species' => 'CCN-51',
            'stage' => TrackingItem::STAGE_NURSERY,
            'quantity' => fake()->numberBetween(10, 200),
            'unit' => 'unidades',
            'location' => 'Vivero Central',
            'minimum_stock' => 10,
            'notes' => null,
            'registered_at' => now(),
        ];
    }
}
