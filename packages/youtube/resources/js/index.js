import { registerExtension } from "../../../support/resources/js/utils.js";
import { Youtube } from "@tiptap/extension-youtube";

registerExtension("youtube", () => [Youtube]);
