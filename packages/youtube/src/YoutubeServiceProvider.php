<?php

namespace Talltap\Youtube;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Talltap\Support\Assets\Js;
use Talltap\Support\Extensions\BubbleMenu;
use Talltap\Support\Extensions\Node;
use Talltap\Support\Extensions\Toolbar;
use Talltap\Support\Facades\TalltapAsset;
use Talltap\Support\Facades\TalltapExtension;

class YoutubeServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('youtube')
            ->hasViews();
    }

    /**
     * Perform post-registration booting of services.
     */
    public function packageBooted(): void
    {
        TalltapAsset::register([
            Js::make('youtube', __DIR__ . '/../dist/index.js'),
        ], 'talltap/youtube');

        TalltapExtension::register([
            Toolbar::make('youtube', YoutubeToolbar::class),
            BubbleMenu::make('youtube', YoutubeBubble::class),
            Node::make('youtube', YoutubeNode::class),
        ]);
    }
}
