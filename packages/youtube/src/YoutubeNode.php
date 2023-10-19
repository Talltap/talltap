<?php

namespace Talltap\Youtube;

use Tiptap\Core\Node;

class YoutubeNode extends Node
{
    public static $name = 'youtube';

    public function addOptions()
    {
        return [
            'addPasteHandler' => true,
            'allowFullscreen' => true,
            'autoplay' => false,
            'ccLanguage' => null,
            'ccLoadPolicy' => null,
            'controls' => true,
            'disableKBcontrols' => false,
            'enableIFrameApi' => false,
            'endTime' => 0,
            'height' => 480,
            'interfaceLanguage' => null,
            'ivLoadPolicy' => 0,
            'loop' => false,
            'modestBranding' => false,
            'HTMLAttributes' => [],
            'inline' => false,
            'nocookie' => false,
            'origin' => '',
            'playlist' => '',
            'progressBarColor' => null,
            'width' => 640,
            'src' => null,
        ];
    }

    public function parseHTML()
    {
        return [
            [
                'tag' => 'div[data-youtube-video]',
            ],
        ];
    }

    public function addAttributes()
    {
        return [
            'src' => [
                'parseHTML' => fn ($DOMNode) => $DOMNode->firstChild->getAttribute('src') ?? null,
            ],
            'start' => [
                'default' => 0,
            ],
            'width' => [
                'default' => $this->options['width'],
            ],
            'height' => [
                'default' => $this->options['height'],
            ],
        ];
    }

    public function renderHTML($node, $HTMLAttributes = []): array
    {
        return [
            'div',
            ['data-youtube-video' => $node->attrs->src, 'class' => 'w-full aspect-video rounded overflow-hidden'],
            [
                'iframe',
                [
                    'width' => $this->options['width'],
                    'src' => $node->attrs->src,
                    'height' => $this->options['height'],
                    'allowfullscreen' => $this->options['allowFullscreen'],
                    'autoplay' => $this->options['autoplay'],
                    'ccLanguage' => $this->options['ccLanguage'],
                    'ccLoadPolicy' => $this->options['ccLoadPolicy'],
                    'disableKBcontrols' => $this->options['disableKBcontrols'],
                    'enableIFrameApi' => $this->options['enableIFrameApi'],
                    'interfaceLanguage' => $this->options['interfaceLanguage'],
                    'loop' => $this->options['loop'],
                    'modestBranding' => $this->options['modestBranding'],
                    'origin' => $this->options['origin'],
                    'playlist' => $this->options['playlist'],
                    'progressBarColor' => $this->options['progressBarColor'],
                    'class' => 'w-full aspect-video',
                ],
                0,
            ],
        ];
    }
}
