<?php

namespace Talltap\Support\Contracts;

interface BubbleMenu
{
    public static function isActive(): array | string;
}
