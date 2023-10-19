import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import { registerExtension } from "../../../support/resources/js/utils.js";

registerExtension("starter-kit", () => [
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Underline,
  Typography,
]);
