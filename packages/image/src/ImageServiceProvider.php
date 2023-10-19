<?php

namespace Talltap\Image;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Talltap\Support\Assets\Js;
use Talltap\Support\Extensions\BubbleMenu;
use Talltap\Support\Facades\TalltapAsset;
use Talltap\Support\Facades\TalltapExtension;

class ImageServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('image')
            ->hasViews();
    }

    /**
     * Perform post-registration booting of services.
     */
    public function packageBooted(): void
    {
        TalltapAsset::register([
            Js::make('image', __DIR__ . '/../dist/index.js'),
        ], 'talltap/image');

        TalltapExtension::register([
            BubbleMenu::make('image', ImageBubble::class),
            // Node::make('image', ImageNode::class),
        ]);
    }
}
