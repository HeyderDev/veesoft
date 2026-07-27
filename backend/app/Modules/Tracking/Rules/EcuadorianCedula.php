<?php

namespace App\Modules\Tracking\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Valida el formato oficial de cedula ecuatoriana de persona natural:
 * 10 digitos, codigo de provincia (2 primeros digitos) entre 01 y 24,
 * tercer digito entre 0 y 5, y digito verificador por modulo 10.
 */
class EcuadorianCedula implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('/^\d{10}$/', $value)) {
            $fail('La cédula debe tener exactamente 10 dígitos numéricos.');

            return;
        }

        $digits = array_map('intval', str_split($value));

        $province = ((int) $digits[0]) * 10 + $digits[1];
        if ($province < 1 || $province > 24) {
            $fail('La cédula no tiene un código de provincia ecuatoriano válido.');

            return;
        }

        if ($digits[2] > 5) {
            $fail('La cédula no corresponde a una persona natural válida.');

            return;
        }

        $coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        $sum = 0;

        foreach ($coefficients as $i => $coefficient) {
            $product = $digits[$i] * $coefficient;
            $sum += $product >= 10 ? $product - 9 : $product;
        }

        $verifier = $sum % 10 === 0 ? 0 : 10 - ($sum % 10);

        if ($verifier !== $digits[9]) {
            $fail('La cédula ingresada no es válida.');
        }
    }
}
