<?php

namespace App\Domain\Commands;

/**
 * Command Interface
 *
 * Represents an intent to change system state.
 * Commands are imperatives: "CreateTeam", "DeleteUser", etc.
 */
interface Command
{
    /**
     * Get the command unique identifier.
     */
    public function commandId(): string;
}
