<?php

namespace Modules\Spaces\Controllers;

use Illuminate\Http\Request;
use Modules\Spaces\Models\Space;

trait ResolvesSpace
{
    protected function resolveSpace(Request $request): Space
    {
        $param = $request->route('space');

        return is_numeric($param)
            ? Space::findOrFail((int) $param)
            : Space::where('slug', $param)->firstOrFail();
    }
}
