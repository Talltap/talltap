<?php

namespace Talltap\Placeholder;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Talltap\Support\Assets\Css;
use Talltap\Support\Assets\Js;
use Talltap\Support\Facades\TalltapAsset;

class PlaceholderServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('placeholder')
            ->hasViews();
    }

    /**
     * Perform post-registration booting of services.
     */
    public function packageBooted(): void
    {
        TalltapAsset::register([
            Js::make('placeholder', __DIR__ . '/../dist/index.js'),
            Css::make('placeholder', __DIR__ . '/../dist/index.css'),
        ], 'talltap/placeholder');
    }
}
