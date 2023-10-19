<?php

namespace Talltap\Link;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Talltap\Support\Assets\Js;
use Talltap\Support\Extensions\BubbleMenu;
use Talltap\Support\Extensions\Node;
use Talltap\Support\Extensions\Toolbar;
use Talltap\Support\Facades\TalltapAsset;
use Talltap\Support\Facades\TalltapExtension;

class LinkServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('link')
            ->hasViews();
    }

    /**
     * Perform post-registration booting of services.
     */
    public function packageBooted(): void
    {
        TalltapAsset::register([
            Js::make('link', __DIR__ . '/../dist/index.js'),
        ], 'talltap/link');

        TalltapExtension::register([
            Toolbar::make('link', LinkToolbar::class),
            BubbleMenu::make('link', LinkBubble::class),
            Node::make('link', LinkNode::class),
        ]);
    }
}
