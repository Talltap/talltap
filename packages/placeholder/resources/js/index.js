import Placeholder from "@tiptap/extension-placeholder";
import {registerExtension} from "../../../support/resources/js/utils.js";

registerExtension('placeholder', (instance, config) => {
    return [
        Placeholder.configure({
            placeholder: ({ node }) => {
                if (config == null) {
                    return "";
                }
                return config[node.type.name] ?? config['default'] ?? "";
            },
        })
    ]
});