<?php

namespace App\Modules\Logistics\Traits;

/**
 * Validador de cédula (10 dígitos) y RUC (13 dígitos) de Ecuador (Módulo 10/11 del SRI
 * y Registro Civil). Portado desde sistema/backend/src/utils/validadorIdentidad.js —
 * mismo algoritmo, distinta sintaxis.
 */
trait ValidatesEcuadorianTaxId
{
    protected function isValidEcuadorianTaxId(string $value): bool
    {
        $value = trim($value);

        return match (strlen($value)) {
            10 => $this->isValidCedula($value),
            13 => $this->isValidRuc($value),
            default => false,
        };
    }

    private function isValidCedula(string $cedula): bool
    {
        if (! preg_match('/^\d{10}$/', $cedula)) {
            return false;
        }

        $province = (int) substr($cedula, 0, 2);
        if ($province < 1 || ($province > 24 && $province !== 30)) {
            return false;
        }

        if ((int) $cedula[2] > 5) {
            return false;
        }

        return $this->validateModulo10($cedula);
    }

    private function isValidRuc(string $ruc): bool
    {
        if (! preg_match('/^\d{13}$/', $ruc)) {
            return false;
        }

        if (substr($ruc, 10, 3) === '000') {
            return false;
        }

        $province = (int) substr($ruc, 0, 2);
        if ($province < 1 || ($province > 24 && $province !== 30)) {
            return false;
        }

        $thirdDigit = (int) $ruc[2];

        // Persona natural: cédula + "001".
        if ($thirdDigit >= 0 && $thirdDigit <= 5) {
            return $this->isValidCedula(substr($ruc, 0, 10)) && str_ends_with($ruc, '001');
        }

        // Sociedad privada.
        if ($thirdDigit === 9) {
            if (! str_ends_with($ruc, '001')) {
                return false;
            }

            return $this->validateModulo11($ruc, [4, 3, 2, 7, 6, 5, 4, 3, 2], 9, 9);
        }

        // Entidad pública.
        if ($thirdDigit === 6) {
            if (! str_ends_with($ruc, '0001')) {
                return false;
            }

            return $this->validateModulo11($ruc, [3, 2, 7, 6, 5, 4, 3, 2], 8, 8);
        }

        return false;
    }

    private function validateModulo10(string $digits): bool
    {
        $coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        $sum = 0;

        for ($i = 0; $i < 9; $i++) {
            $value = (int) $digits[$i] * $coefficients[$i];
            $sum += $value >= 10 ? $value - 9 : $value;
        }

        $checkDigit = (int) $digits[9];
        $remainder = $sum % 10;
        $calculated = $remainder === 0 ? 0 : 10 - $remainder;

        return $checkDigit === $calculated;
    }

    private function validateModulo11(string $digits, array $coefficients, int $sumLength, int $checkDigitPosition): bool
    {
        $sum = 0;

        for ($i = 0; $i < $sumLength; $i++) {
            $sum += (int) $digits[$i] * $coefficients[$i];
        }

        $checkDigit = (int) $digits[$checkDigitPosition];
        $remainder = $sum % 11;
        $calculated = $remainder === 0 ? 0 : 11 - $remainder;

        return $checkDigit === $calculated;
    }
}
