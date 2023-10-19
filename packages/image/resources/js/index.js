import { registerExtension } from "../../../support/resources/js/utils.js";
import TalltapImage from "./talltap_image.js";

registerExtension('image', () => [
    TalltapImage
]);