<?php

namespace App\Domain\ValueObjects;

/**
 * Money Value Object
 *
 * Immutable value object for monetary values.
 * Uses the smallest currency unit (cents) to avoid floating point issues.
 */
readonly class Money
{
    private const MAX_AMOUNT = 999999999;

    public function __construct(
        public readonly int $amount,
        public readonly string $currency = 'EUR',
    ) {
        $this->validate();
    }

    /**
     * Create money from amount in cents.
     */
    public static function fromCents(int $amount, string $currency = 'EUR'): self
    {
        return new self($amount, $currency);
    }

    /**
     * Create money from amount in major unit (euros, dollars, etc.).
     */
    public static function fromDecimal(float|string $amount, string $currency = 'EUR'): self
    {
        $amountInCents = (int) round((float) $amount * 100);

        return new self($amountInCents, $currency);
    }

    /**
     * Create zero money.
     */
    public static function zero(string $currency = 'EUR'): self
    {
        return new self(0, $currency);
    }

    /**
     * Validate the money value.
     */
    private function validate(): void
    {
        if ($this->amount < 0) {
            throw new \InvalidArgumentException('Money amount cannot be negative.');
        }

        if ($this->amount > self::MAX_AMOUNT) {
            throw new \InvalidArgumentException('Money amount exceeds maximum.');
        }

        if (! preg_match('/^[A-Z]{3}$/', $this->currency)) {
            throw new \InvalidArgumentException('Currency must be a valid ISO 4217 code.');
        }
    }

    /**
     * Get the amount in major unit (e.g., euros).
     */
    public function toDecimal(): float
    {
        return $this->amount / 100;
    }

    /**
     * Get formatted string.
     */
    public function format(?string $locale = null): string
    {
        $formatter = new \NumberFormatter(
            $locale ?? 'fr_FR',
            \NumberFormatter::CURRENCY
        );

        return $formatter->formatCurrency($this->toDecimal(), $this->currency);
    }

    /**
     * Add money.
     */
    public function add(Money $other): Money
    {
        $this->assertSameCurrency($other);

        return new self($this->amount + $other->amount, $this->currency);
    }

    /**
     * Subtract money.
     */
    public function subtract(Money $other): Money
    {
        $this->assertSameCurrency($other);

        return new self($this->amount - $other->amount, $this->currency);
    }

    /**
     * Multiply by factor.
     */
    public function multiply(float $factor): Money
    {
        return new self((int) round($this->amount * $factor), $this->currency);
    }

    /**
     * Divide by factor.
     */
    public function divide(float $factor): Money
    {
        if ($factor === 0.0) {
            throw new \InvalidArgumentException('Cannot divide by zero.');
        }

        return new self((int) round($this->amount / $factor), $this->currency);
    }

    /**
     * Get percentage of this money.
     */
    public function percentage(float $percent): Money
    {
        return $this->multiply($percent / 100);
    }

    /**
     * Check if this money is zero.
     */
    public function isZero(): bool
    {
        return $this->amount === 0;
    }

    /**
     * Check if this money is positive.
     */
    public function isPositive(): bool
    {
        return $this->amount > 0;
    }

    /**
     * Compare two money values.
     *
     * @return -1|0|1
     */
    public function compare(Money $other): int
    {
        $this->assertSameCurrency($other);

        return $this->amount <=> $other->amount;
    }

    /**
     * Check if this money is greater than another.
     */
    public function greaterThan(Money $other): bool
    {
        return $this->compare($other) > 0;
    }

    /**
     * Check if this money is less than another.
     */
    public function lessThan(Money $other): bool
    {
        return $this->compare($other) < 0;
    }

    /**
     * Check if two money values are equal.
     */
    public function equals(Money $other): bool
    {
        return $this->compare($other) === 0;
    }

    /**
     * Ensure both money values have the same currency.
     */
    private function assertSameCurrency(Money $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Cannot operate on different currencies.');
        }
    }

    /**
     * Get the money as string.
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
