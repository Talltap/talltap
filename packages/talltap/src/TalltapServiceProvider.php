<?php

namespace Talltap\Talltap;

use Illuminate\Support\Facades\Blade;
use Livewire\Livewire;
use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Talltap\Support\Assets\AssetManager;
use Talltap\Support\Assets\Js;
use Talltap\Support\Facades\TalltapAsset;

class TalltapServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('talltap')
            ->hasConfigFile()
            ->hasViews();
    }

    /**
     * Perform post-registration booting of services.
     */
    public function packageBooted(): void
    {
        TalltapAsset::register([
            Js::make('talltap', __DIR__ . '/../dist/index.js'),
        ], 'talltap/talltap');

        Livewire::component('talleditor', 'Talltap\Talltap\Livewire\Editor');

        Blade::directive('talltapScripts', function (string $expression): string {
            return "<?php echo \Talltap\Support\Facades\TalltapAsset::renderScripts({$expression}) ?>";
        });
    }

    public function packageRegistered(): void
    {
        $this->app->scoped(
            AssetManager::class,
            fn () => new AssetManager(),
        );
    }
}
