export function registerExtension(id, callback){
    if (id === undefined) {
        throw new Error("id can't be undefined when registering an extension");
    }
    if (callback === undefined) {
        throw new Error("callback can't be undefined when registering an extension");
    }
    document.addEventListener("alpine:init", () => {
        const ext = callback(window.talltapRegistry.getConfig(id));
        if (Array.isArray(ext)) {
            for (const extElement of ext) {
                window.talltapRegistry.register(extElement);
            }
        } else {
            window.talltapRegistry.register(ext);
        }
    });
}

export function bubbleMenuRef(displayCondition = undefined){
    return {
        editorRef: undefined,
        show: !displayCondition,
        initTalltap() {
            this.editorRef = this.$el.parentElement.dataset.editor;
            this.evaluateIfShowing();
        },
        evaluateIfShowing(){
            if (!displayCondition) {
                return;
            }
            this.show = this.getEditor().isActive(displayCondition);
        },
        editor() {
            this.evaluateIfShowing();
            return this.getEditor();
        },
        getEditor() {
            return window.talltap[this.editorRef];
        },
        'bubbleMenuRef': {
            ['x-init']() {
                this.initTalltap();
            },
            ['x-show']() {
                return this.show;
            },
            ['x-on:update.window']() {
                this.evaluateIfShowing();
            }
        },
    }
}