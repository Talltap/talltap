<?php

namespace Talltap\Talltap\Concerns;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Str;
use Livewire\Livewire;

trait InteractsWithBubble
{
    private static ?string $bubbleComponentString = null;

    private static bool $bubbleComponentIsLivewire = false;

    public static function hasBubble(): bool
    {
        return true;
    }

    public static function isBubbleLivewire(): bool
    {
        return self::$bubbleComponentIsLivewire;
    }

    public static function bootInteractsWithBubble(): void
    {
        self::registerBubble();
    }

    public static function getBubbleComponent(): string
    {
        return self::$bubbleComponentString;
    }

    public static function registerBubble(): void
    {
        $bubbleClass = self::class . 'Bubble';
        if (class_exists($bubbleClass)) {
            $clazz = new \ReflectionClass($bubbleClass);
            $name = 'ext-' . Str::snake(($clazz)->getShortName(), '-');

            if (str_starts_with($clazz->getParentClass()->getName(), 'Livewire')) {
                Livewire::component($name, $bubbleClass);
                self::$bubbleComponentIsLivewire = true;
            } else {
                Blade::component($name, $bubbleClass);
            }
            self::$bubbleComponentString = $name;
        }
    }
}
