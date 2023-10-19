<?php

namespace Talltap\Support\Facades;

use Illuminate\Support\Facades\Facade;
use Talltap\Support\Assets\Asset;
use Talltap\Support\Assets\AssetManager;

/**
 * @method static array getAlpineComponents(array | null $packages = null)
 * @method static string getAlpineComponentSrc(string $id, string $package = 'app')
 * @method static array getScriptData(array | null $packages = null)
 * @method static string getScriptSrc(string $id, string $package = 'app')
 * @method static array getScripts(array | null $packages = null, bool $withCore = true)
 * @method static string getStyleHref(string $id, string $package = 'app')
 * @method static array getStyles(array | null $packages = null)
 * @method static array getThemes()
 * @method static string renderScripts(array | null $packages = null, bool $withCore = true)
 * @method static string renderStyles(array | null $packages = null)
 *
 * @see AssetManager
 */
class TalltapAsset extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return AssetManager::class;
    }

    /**
     * @param  array<Asset>  $assets
     */
    public static function register(array $assets, string $package = 'app'): void
    {
        static::resolved(function (AssetManager $assetManager) use ($assets, $package) {
            $assetManager->register($assets, $package);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function registerScriptData(array $data, ?string $package = null): void
    {
        static::resolved(function (AssetManager $assetManager) use ($data, $package) {
            $assetManager->registerScriptData($data, $package);
        });
    }
}
