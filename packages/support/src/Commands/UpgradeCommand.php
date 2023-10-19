<?php

namespace Talltap\Support\Commands;

use Filament\Support\Events\FilamentUpgraded;
use Illuminate\Console\Command;

class UpgradeCommand extends Command
{
    protected $description = 'Upgrade Talltap to the latest version';

    protected $signature = 'talltap:upgrade';

    public function handle(): int
    {
        foreach ([
            AssetsCommand::class,
            'config:clear',
            'route:clear',
            'view:clear',
        ] as $command) {
            $this->call($command);
        }

        FilamentUpgraded::dispatch();

        $this->components->info('Successfully upgraded!');

        return static::SUCCESS;
    }
}
