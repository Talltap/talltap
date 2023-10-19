<?php

namespace Talltap\Talltap\Contracts;

interface HasBubble
{
    public const hasBubble = true;

    public static function getBubbleComponent(): string;
}
