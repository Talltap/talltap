import { registerExtension } from "../../../support/resources/js/utils.js";
import TalltapImage from "./talltap_image.js";

registerExtension('image', (instance, config) => [
    TalltapImage(async (file) => {
        const wire = Livewire.find(instance.name);
        const filenamePromise = new Promise((resolve) => {
            wire.upload(
                "files",
                file,
                (uploadedFilename) => {
                    // Success callback.
                    console.log(uploadedFilename);
                    // this.isUploading = false;
                    resolve(uploadedFilename);
                },
                () => {
                    // this.isUploading = false;
                    // Error callback.
                },
                (event) => {
                    // this.isUploading = true;
                    // Progress callback.
                    // event.detail.progress contains a number between 1 and 100 as the upload progresses.
                },
            );
        });
        return {
            src: await filenamePromise.then((filename) => wire.getTemporaryUrl(filename)),
            ref: await filenamePromise,
        };
    })
]);