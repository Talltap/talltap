<?php

namespace Talltap\Support\Commands;

use Illuminate\Console\Command;
use Illuminate\Filesystem\Filesystem;
use Talltap\Support\Commands\Concerns\CanManipulateFiles;
use Talltap\Support\Facades\TalltapAsset;

class AssetsCommand extends Command
{
    use CanManipulateFiles;

    protected $description = 'Set up Talltap assets.';

    protected $signature = 'talltap:assets';

    /** @var array<string> */
    protected array $publishedAssets = [];

    public function handle(): int
    {
        foreach (TalltapAsset::getAlpineComponents() as $asset) {
            if ($asset->isRemote()) {
                continue;
            }

            $this->copyAsset($asset->getPath(), $asset->getPublicPath());
        }

        foreach (TalltapAsset::getScripts() as $asset) {
            if ($asset->isRemote()) {
                continue;
            }

            $this->copyAsset($asset->getPath(), $asset->getPublicPath());
        }

        foreach (TalltapAsset::getStyles() as $asset) {
            if ($asset->isRemote()) {
                continue;
            }

            $this->copyAsset($asset->getPath(), $asset->getPublicPath());
        }

        foreach (TalltapAsset::getThemes() as $asset) {
            if ($asset->isRemote()) {
                continue;
            }

            $this->copyAsset($asset->getPath(), $asset->getPublicPath());
        }

        $this->components->bulletList($this->publishedAssets);

        $this->components->info('Successfully published assets!');

        return static::SUCCESS;
    }

    protected function copyAsset(string $from, string $to): void
    {
        $filesystem = app(Filesystem::class);

        [$from, $to] = str_replace('/', DIRECTORY_SEPARATOR, [$from, $to]);

        $filesystem->ensureDirectoryExists(
            (string) str($to)
                ->beforeLast(DIRECTORY_SEPARATOR),
        );

        $filesystem->copy($from, $to);

        $this->publishedAssets[] = $to;
    }
}
