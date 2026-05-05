<?php

namespace App\Domain\ValueObjects;

/**
 * Email Value Object
 *
 * Immutable value object for email addresses.
 * Provides validation and safe email handling.
 */
readonly class Email
{
    private const MAX_LENGTH = 254;

    private string $value;

    public function __construct(string $email)
    {
        $this->validate($email);
        $this->value = strtolower(trim($email));
    }

    /**
     * Create an email from string.
     */
    public static function from(string $email): self
    {
        return new self($email);
    }

    /**
     * Create an email from nullable string.
     */
    public static function nullable(?string $email): ?self
    {
        return $email === null ? null : new self($email);
    }

    /**
     * Validate the email format.
     */
    private function validate(string $email): void
    {
        if (trim($email) === '') {
            throw new \InvalidArgumentException('Email cannot be empty.');
        }

        if (strlen($email) > self::MAX_LENGTH) {
            throw new \InvalidArgumentException('Email is too long.');
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email format.');
        }
    }

    /**
     * Get the local part of the email (before @).
     */
    public function local(): string
    {
        return explode('@', $this->value)[0];
    }

    /**
     * Get the domain part of the email (after @).
     */
    public function domain(): string
    {
        return explode('@', $this->value)[1] ?? '';
    }

    /**
     * Check if email is from a specific domain.
     */
    public function isFromDomain(string $domain): bool
    {
        return $this->domain() === strtolower($domain);
    }

    /**
     * Obfuscate the email for display (e.g., "a***@example.com").
     */
    public function obfuscated(): string
    {
        $local = $this->local();
        $domain = $this->domain();

        if (strlen($local) <= 2) {
            return $local[0].'***@'.$domain;
        }

        return $local[0].str_repeat('*', strlen($local) - 2).$local[strlen($local) - 1].'@'.$domain;
    }

    /**
     * Get the email as string.
     */
    public function toString(): string
    {
        return $this->value;
    }

    /**
     * Get the email as string.
     */
    public function __toString(): string
    {
        return $this->value;
    }

    /**
     * Check if two emails are equal.
     */
    public function equals(Email $other): bool
    {
        return $this->value === $other->value;
    }
}
