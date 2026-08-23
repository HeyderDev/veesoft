<?php

namespace Database\Factories;

use App\Modules\Tracking\Models\TrackingClient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TrackingClient>
 */
class TrackingClientFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->name(),
            'cedula' => $this->generateValidCedula(),
            'phone' => '09'.fake()->unique()->numerify('########'),
        ];
    }

    /**
     * Genera una cedula ecuatoriana valida (formato + digito verificador por
     * modulo 10), para no depender de valores fijos repetidos en los tests.
     */
    private function generateValidCedula(): string
    {
        $province = str_pad((string) fake()->numberBetween(1, 24), 2, '0', STR_PAD_LEFT);
        $thirdDigit = (string) fake()->numberBetween(0, 5);
        $rest = fake()->numerify('######');

        $digits = array_map('intval', str_split($province.$thirdDigit.$rest));
        $coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        $sum = 0;

        foreach ($coefficients as $i => $coefficient) {
            $product = $digits[$i] * $coefficient;
            $sum += $product >= 10 ? $product - 9 : $product;
        }

        $verifier = $sum % 10 === 0 ? 0 : 10 - ($sum % 10);

        return $province.$thirdDigit.$rest.$verifier;
    }
}
