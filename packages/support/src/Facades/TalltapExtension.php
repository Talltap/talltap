<?php

namespace Talltap\Support\Facades;

use Illuminate\Support\Facades\Facade;
use Talltap\Support\Extensions\Extension;
use Talltap\Support\Extensions\ExtensionManager;

/**
 * @method static array getToolbarComponents(array | null $packages = null)
 * @method static array getBubbleMenuComponents(array | null $packages = null)
 *
 * @see ExtensionManager
 */
class TalltapExtension extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ExtensionManager::class;
    }

    /**
     * @param  array<Extension>  $extensions
     */
    public static function register(array $extensions, string $package = 'app'): void
    {
        static::resolved(function (ExtensionManager $extensionManager) use ($extensions, $package) {
            $extensionManager->register($extensions, $package);
        });
    }
}
