<?php

namespace App\Core\Extensions;

enum ExtensionState: string
{
    case NotInstalled = 'not_installed';
    case Enabled = 'enabled';
    case Disabled = 'disabled';
    case Errored = 'errored';
    case Incompatible = 'incompatible';
}
