<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Model;

trait AfterPersist
{
    /**
     * Execute a callback after the model is persisted.
     *
     * If the model already exists (update), the callback runs immediately.
     * If the model is new (create), the callback runs after the created event.
     */
    public function afterPersist(Model $model, callable $callback): void
    {
        if ($model->exists) {
            $callback($model);

            return;
        }

        $model::created(function (Model $m) use ($model, $callback) {
            if ($m->is($model)) {
                $callback($m);
            }
        });
    }
}
