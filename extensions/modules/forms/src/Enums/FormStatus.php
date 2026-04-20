<?php

namespace Modules\Forms\Enums;

enum FormStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Closed = 'closed';
}
