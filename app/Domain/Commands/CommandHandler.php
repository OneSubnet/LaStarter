<?php

namespace App\Domain\Commands;

/**
 * Command Handler Interface
 *
 * Handles the execution of a command.
 * Each command should have a dedicated handler.
 *
 * @template TCommand of Command
 */
interface CommandHandler
{
    /**
     * Handle the command.
     *
     * @param  TCommand  $command
     */
    public function handle(Command $command): mixed;
}
