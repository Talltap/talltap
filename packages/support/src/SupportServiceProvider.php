<?php

namespace Talltap\Support;

use Illuminate\Support\Facades\Blade;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Talltap\Support\Assets\AssetManager;
use Talltap\Support\Assets\Js;
use Talltap\Support\Commands\AssetsCommand;
use Talltap\Support\Commands\UpgradeCommand;
use Talltap\Support\Extensions\ExtensionManager;
use Talltap\Support\Facades\TalltapAsset;

class SupportServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('talltap-support')
            ->hasCommands([
                AssetsCommand::class,
                UpgradeCommand::class,
            ])
            ->hasViews();
    }

    /**
     * Perform post-registration booting of services.
     */
    public function packageBooted(): void
    {
        TalltapAsset::register([
            Js::make('support', __DIR__ . '/../dist/index.js')->core(),
        ], 'talltap/support');

        Blade::directive('talltapScripts', function (string $expression): string {
            return "<?php echo \Talltap\Support\Facades\TalltapAsset::renderScripts({$expression}) ?>";
        });

        Blade::directive('talltapStyles', function (string $expression): string {
            return "<?php echo \Talltap\Support\Facades\TalltapAsset::renderStyles({$expression}) ?>";
        });

        Blade::anonymousComponentPath(__DIR__ . '/../resources/components', 'talltap');
    }

    public function packageRegistered(): void
    {
        $this->app->scoped(
            AssetManager::class,
            fn () => new AssetManager(),
        );
        $this->app->scoped(
            ExtensionManager::class,
            fn () => new ExtensionManager(),
        );
    }
}
