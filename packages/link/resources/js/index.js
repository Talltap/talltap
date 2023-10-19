import { registerExtension } from "../../../support/resources/js/utils.js";
import Link from "@tiptap/extension-link";
import { BubbleMenu } from "@tiptap/extension-bubble-menu";

registerExtension("link", () => [
  Link.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-k": ({
          editor: {
            state: {
              selection: { from, to },
            },
          },
        }) => {
          if (from !== to) {
            // setGlobalLinkModalVisibleState(true)
            return true;
          }

          return false;
        },
      };
    },
  }).configure({
    HTMLAttributes: { target: "_blank", rel: "noopener" },
    openOnClick: false,
    linkOnPaste: true,
    autolink: true,
  }),
]);
