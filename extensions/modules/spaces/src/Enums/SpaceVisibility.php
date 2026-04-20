<?php

namespace Modules\Spaces\Enums;

enum SpaceVisibility: string
{
    case Public = 'public';
    case Restricted = 'restricted';
    case Private = 'private';
}
