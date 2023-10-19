<?php

namespace Talltap\Support\Extensions;

class Node extends Extension
{
    final public function __construct(
        protected string $id,
        protected ?string $class = null
    ) {
    }

    public static function make(string $id, ?string $class = null): static
    {
        return app(static::class, ['id' => $id, 'class' => $class]);
    }
}
