<?php

namespace Modules\AilesInvisibles\Services;

use Modules\AilesInvisibles\Models\Client;

class VatService
{
    protected array $rates = [
        'FR' => 20.0, 'BE' => 21.0, 'DE' => 19.0, 'IT' => 22.0,
        'ES' => 21.0, 'LU' => 17.0, 'CH' => 8.1, 'GB' => 20.0,
        'MC' => 20.0, 'NL' => 21.0, 'AT' => 20.0, 'PT' => 23.0,
    ];

    // EU country codes
    protected array $euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

    public function getRate(string $country): float
    {
        return $this->rates[$country] ?? 0.0;
    }

    // Returns: ['rate' => float, 'amount' => float, 'label' => string]
    public function calculateTax(Client $client, float $amount, string $sellerCountry = 'FR'): array
    {
        // Client hors UE → 0% (export)
        if (! in_array($client->country, $this->euCountries)) {
            return ['rate' => 0.0, 'amount' => 0.0, 'label' => 'Exporation (HT)'];
        }

        // Client pro UE avec numero TVA valide, pays != vendeur → autoliquidation
        if ($client->isPro() && $client->country !== $sellerCountry && ! empty($client->vat_number)) {
            return ['rate' => 0.0, 'amount' => 0.0, 'label' => 'Autoliquidation intra-UE'];
        }

        // Sinon → taux du pays du client
        $rate = $this->getRate($client->country);

        return [
            'rate' => $rate,
            'amount' => round($amount * $rate / 100, 2),
            'label' => "TVA {$rate}%",
        ];
    }

    public function validateVatNumber(string $number, string $country): bool
    {
        $patterns = [
            'FR' => '/^FR[0-9A-Z]{2}[0-9]{9}$/',
            'BE' => '/^BE0[0-9]{9}$/',
            'DE' => '/^DE[0-9]{9}$/',
            'IT' => '/^IT[0-9]{11}$/',
            'ES' => '/^ES[A-Z][0-9]{7}[A-Z0-9]$/',
            'NL' => '/^NL[0-9]{9}B[0-9]{2}$/',
            'LU' => '/^LU[0-9]{8}$/',
            'AT' => '/^ATU[0-9]{8}$/',
            'PT' => '/^PT[0-9]{9}$/',
        ];

        if (! isset($patterns[$country])) {
            return false;
        }

        return (bool) preg_match($patterns[$country], strtoupper($number));
    }

    public function isEuCountry(string $country): bool
    {
        return in_array($country, $this->euCountries);
    }
}
