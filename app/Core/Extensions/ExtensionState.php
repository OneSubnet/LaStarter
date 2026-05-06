<?php

namespace App\Core\Extensions;

enum ExtensionState: string
{
    case Installed = 'installed';
    case Enabled = 'enabled';
    case Disabled = 'disabled';
    case Errored = 'errored';
}
