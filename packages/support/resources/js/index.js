import {bubbleMenuRef} from "./utils.js";

(function() {
    this.talltapRegistry = {
        extensions: [],
        config: undefined,
        init(config) {
            this.config = config;
        },
        register(extension) {
            if (!this.config) {
                throw new Error("TallTap registry hasn't been initialized yet");
            }
            this.extensions.push(extension);
        },
        getExtensions(){
            if (!this.config) {
                throw new Error("TallTap registry hasn't been initialized yet");
            }
            return this.extensions;
        },
        getConfig(extensionId = null){
            if (!this.config) {
                throw new Error("TallTap registry hasn't been initialized yet");
            }
            if (extensionId == null) {
                return this.config;
            }
            return this.config[extensionId] ?? null;
        }
    }
}());

(function() {
    this.bubbleMenuRef = bubbleMenuRef;
}());