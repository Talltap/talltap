<?php

namespace Talltap\Talltap\Concerns;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Str;
use Livewire\Livewire;

trait InteractsWithToolbar
{
    private static ?string $toolbarComponentString = null;

    private static bool $toolbarComponentIsLivewire = false;

    public static function hasToolbar(): bool
    {
        return true;
    }

    public static function isToolbarLivewire(): bool
    {
        return self::$toolbarComponentIsLivewire;
    }

    public static function bootInteractsWithToolbar(): void
    {
        self::registerToolbar();
    }

    public static function getToolbarComponent(): string
    {
        return self::$toolbarComponentString;
    }

    public static function registerToolbar(): void
    {
        $toolbarClass = self::class . 'Toolbar';
        if (class_exists($toolbarClass)) {
            $clazz = new \ReflectionClass($toolbarClass);
            $name = 'ext-' . Str::snake(($clazz)->getShortName(), '-');

            if (str_starts_with($clazz->getParentClass()->getName(), 'Livewire')) {
                Livewire::component($name, $toolbarClass);
                self::$toolbarComponentIsLivewire = true;
            } else {
                Blade::component($name, $toolbarClass);
            }
            self::$toolbarComponentString = $name;
        }
    }
}
