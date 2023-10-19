<?php

namespace Talltap\Talltap\Contracts;

use Illuminate\Support\Stringable;

abstract class Extension extends Stringable
{
    private static $traitInitializers = [];

    private static int $order = 0;

    public static function make()
    {
        return new static();
    }

    public static function boot()
    {
        self::bootTraits();
    }

    public static function getToolbarComponent()
    {
    }

    public static function hasToolbar(): bool
    {
        return false;
    }

    public static function hasBubble(): bool
    {
        return false;
    }

    public static function toolbarOrder(): int
    {
        return self::$order;
    }

    public static function getNode()
    {
    }

    protected static function bootTraits(): void
    {
        $class = static::class;

        $booted = [];

        static::$traitInitializers[$class] = [];

        foreach (class_uses_recursive($class) as $trait) {
            $method = 'boot' . class_basename($trait);

            if (method_exists($class, $method) && ! in_array($method, $booted)) {
                forward_static_call([$class, $method]);

                $booted[] = $method;
            }

            if (method_exists($class, $method = 'initialize' . class_basename($trait))) {
                static::$traitInitializers[$class][] = $method;

                static::$traitInitializers[$class] = array_unique(
                    static::$traitInitializers[$class]
                );
            }
        }
    }
}
