<?php

namespace Modules\Spaces\Enums;

enum MemberRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Viewer = 'viewer';
}
