import { bubbleMenuRef } from "./utils.js";

(function () {
  this.talltapRegistry = {
    instances: [],
    globalExtensions: [],
    init(instanceName, config) {
      const instance = {
        name: instanceName,
        config,
        extensions: [],
      };

      for (const { id, callback } of this.globalExtensions) {
        const bootedExtension = callback(instance, config[id] ?? null);

        if (Array.isArray(bootedExtension)) {
          for (const extElement of bootedExtension) {
            instance.extensions.push(extElement);
          }
        } else {
          instance.extensions.push(ext);
        }
      }

      this.instances.push(instance);
    },
    register(id, callback) {
      this.globalExtensions.push({
        id,
        callback,
      });
    },
    getInstance(instanceName) {
      if (this.instances.length === 0) {
        throw new Error(
          `TallTap instance ${instanceName} hasn't been initialized yet`
        );
      }
      return this.instances.find((instance) => instance.name === instanceName);
    },
    getConfig(instance, extensionId = null) {
      if (extensionId == null) {
        return instance.config;
      }
      return instance.config[extensionId] ?? null;
    },
  };
})();

(function () {
  this.bubbleMenuRef = bubbleMenuRef;
})();
