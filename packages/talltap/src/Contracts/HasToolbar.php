<?php

namespace Talltap\Talltap\Contracts;

interface HasToolbar
{
    public const hasToolbar = true;

    public static function getToolbarComponent(): string;

    public static function toolbarOrder(): int;
}
