import { Node, nodeInputRule, mergeAttributes } from "@tiptap/core";

import {placeholderPlugin, uploadImagePlugin} from "./prosemirror_plugin";

/**
 * Tiptap Extension to upload images
 * @see  https://gist.github.com/slava-vishnyakov/16076dff1a77ddaca93c4bccd4ec4521#gistcomment-3744392
 * @since 7th July 2021
 *
 * Matches following attributes in Markdown-typed image: [, alt, src, title]
 *
 * Example:
 * ![Lorem](image.jpg) -> [, "Lorem", "image.jpg"]
 * ![](image.jpg "Ipsum") -> [, "", "image.jpg", "Ipsum"]
 * ![Lorem](image.jpg "Ipsum") -> [, "Lorem", "image.jpg", "Ipsum"]
 */

const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export default Node.create({
  name: "image",

  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {}
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      }
    };
  },
  parseHTML: () => [
    {
      tag: "img[src]",
      getAttrs: (dom) => {
        if (typeof dom === "string") return {};
        const element = dom;

        const obj = {
          src: element.getAttribute("src"),
          title: element.getAttribute("title"),
          alt: element.getAttribute("alt"),
        };
        return obj;
      },
    },
  ],
  renderHTML: ({ HTMLAttributes }) => [
    "img",
    mergeAttributes(HTMLAttributes),
  ],

  addCommands() {
    return {
      setImage:
        (attrs) =>
          ({ state, dispatch }) => {
            const { selection } = state;
            const position = selection.$head
              ? selection.$head.pos
              : selection.$to.pos;

            const node = this.type.create(attrs);
            const transaction = state.tr.insert(position, node);
            return dispatch?.(transaction);
          },
    };
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: IMAGE_INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => {
          const [, alt, src, title] = match;
          return {
            src,
            alt,
            title,
          };
        },
      }),
    ];
  },
  addProseMirrorPlugins() {
    return [uploadImagePlugin(this.uploadFn), placeholderPlugin];
  },

  async uploadFn(file) {
    const filenamePromise = new Promise((resolve) => {
      console.log('uploading');
      this.$wire.upload(
        "images",
        file,
        (uploadedFilename) => {
          // Success callback.
          console.log(uploadedFilename);
          this.isUploading = false;
          resolve(uploadedFilename);
        },
        () => {
          this.isUploading = false;
          // Error callback.
        },
        (event) => {
          this.isUploading = true;
          // Progress callback.
          // event.detail.progress contains a number between 1 and 100 as the upload progresses.
        },
      );
    });
    return {
      src: await this.getTempUrl(await filenamePromise),
      ref: await filenamePromise,
    };
  }
});