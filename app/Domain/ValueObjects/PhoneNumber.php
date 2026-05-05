<?php

namespace App\Domain\ValueObjects;

/**
 * Phone Number Value Object
 *
 * Immutable value object for phone numbers.
 * Provides validation and formatting.
 */
readonly class PhoneNumber
{
    public function __construct(
        public readonly string $number,
        public readonly ?string $countryCode = null,
    ) {
        $this->validate();
    }

    /**
     * Create a phone number from string.
     */
    public static function from(string $number, ?string $countryCode = null): self
    {
        return new self($number, $countryCode);
    }

    /**
     * Create a phone number from nullable string.
     */
    public static function nullable(?string $number, ?string $countryCode = null): ?self
    {
        return $number === null ? null : new self($number, $countryCode);
    }

    /**
     * Validate the phone number.
     */
    private function validate(): void
    {
        $cleanNumber = preg_replace('/[^0-9+]/', '', $this->number);

        if (trim($cleanNumber) === '') {
            throw new \InvalidArgumentException('Phone number cannot be empty.');
        }

        if (strlen($cleanNumber) < 7) {
            throw new \InvalidArgumentException('Phone number is too short.');
        }

        if (strlen($cleanNumber) > 15) {
            throw new \InvalidArgumentException('Phone number is too long.');
        }
    }

    /**
     * Get the formatted phone number.
     */
    public function format(): string
    {
        $number = preg_replace('/[^0-9]/', '', $this->number);

        if ($this->countryCode) {
            return '+'.$this->countryCode.' '.$number;
        }

        return $number;
    }

    /**
     * Get the phone number as E.164 format.
     */
    public function toE164(): string
    {
        $number = preg_replace('/[^0-9]/', '', $this->number);

        if ($this->countryCode) {
            return '+'.$this->countryCode.$number;
        }

        return $number;
    }

    /**
     * Check if two phone numbers are equal.
     */
    public function equals(PhoneNumber $other): bool
    {
        return $this->toE164() === $other->toE164();
    }

    /**
     * Get the phone number as string.
     */
    public function toString(): string
    {
        return $this->format();
    }

    public function __toString(): string
    {
        return $this->toString();
    }
}
