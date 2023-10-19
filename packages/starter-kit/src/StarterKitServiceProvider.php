<?php

namespace Talltap\StarterKit;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Talltap\StarterKit\Extensions\Alignment\AlignmentToolbar;
use Talltap\StarterKit\Extensions\Heading\HeadingToolbar;
use Talltap\StarterKit\Extensions\Lists\ListsToolbar;
use Talltap\StarterKit\Extensions\Typography\TypographyBubble;
use Talltap\StarterKit\Extensions\Typography\TypographyToolbar;
use Talltap\Support\Assets\Js;
use Talltap\Support\Extensions\BubbleMenu;
use Talltap\Support\Extensions\Toolbar;
use Talltap\Support\Facades\TalltapAsset;
use Talltap\Support\Facades\TalltapExtension;

class StarterKitServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('starter-kit')
            ->hasViews();
    }

    /**
     * Perform post-registration booting of services.
     */
    public function packageBooted(): void
    {

        TalltapAsset::register([
            Js::make('starter-kit', __DIR__ . '/../dist/index.js'),
        ], 'talltap/starter-kit');

        TalltapExtension::register([
            Toolbar::make('alignment', AlignmentToolbar::class),
            Toolbar::make('heading', HeadingToolbar::class),
            Toolbar::make('lists', ListsToolbar::class),
            Toolbar::make('typography', TypographyToolbar::class),
            BubbleMenu::make('typography', TypographyBubble::class),
        ], 'talltap/starter-kit');
    }
}
