(() => {
  // packages/support/resources/js/utils.js
  function bubbleMenuRef(displayCondition = void 0) {
    return {
      editorRef: void 0,
      show: !displayCondition,
      initTalltap() {
        this.editorRef = this.$el.parentElement.dataset.editor;
        this.evaluateIfShowing();
      },
      evaluateIfShowing() {
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
      bubbleMenuRef: {
        ["x-init"]() {
          this.initTalltap();
        },
        ["x-show"]() {
          return this.show;
        },
        ["x-on:update.window"]() {
          this.evaluateIfShowing();
        },
      },
    };
  }

  // packages/support/resources/js/index.js
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
        return this.instances.find(
          (instance) => instance.name === instanceName
        );
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
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vcmVzb3VyY2VzL2pzL3V0aWxzLmpzIiwgIi4uL3Jlc291cmNlcy9qcy9pbmRleC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRXh0ZW5zaW9uKGlkLCBjYWxsYmFjaykge1xuICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImlkIGNhbid0IGJlIHVuZGVmaW5lZCB3aGVuIHJlZ2lzdGVyaW5nIGFuIGV4dGVuc2lvblwiKTtcbiAgfVxuICBpZiAoY2FsbGJhY2sgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiY2FsbGJhY2sgY2FuJ3QgYmUgdW5kZWZpbmVkIHdoZW4gcmVnaXN0ZXJpbmcgYW4gZXh0ZW5zaW9uXCJcbiAgICApO1xuICB9XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhbHBpbmU6aW5pdFwiLCAoKSA9PiB7XG4gICAgd2luZG93LnRhbGx0YXBSZWdpc3RyeS5yZWdpc3RlcihpZCwgY2FsbGJhY2spO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1YmJsZU1lbnVSZWYoZGlzcGxheUNvbmRpdGlvbiA9IHVuZGVmaW5lZCkge1xuICByZXR1cm4ge1xuICAgIGVkaXRvclJlZjogdW5kZWZpbmVkLFxuICAgIHNob3c6ICFkaXNwbGF5Q29uZGl0aW9uLFxuICAgIGluaXRUYWxsdGFwKCkge1xuICAgICAgdGhpcy5lZGl0b3JSZWYgPSB0aGlzLiRlbC5wYXJlbnRFbGVtZW50LmRhdGFzZXQuZWRpdG9yO1xuICAgICAgdGhpcy5ldmFsdWF0ZUlmU2hvd2luZygpO1xuICAgIH0sXG4gICAgZXZhbHVhdGVJZlNob3dpbmcoKSB7XG4gICAgICBpZiAoIWRpc3BsYXlDb25kaXRpb24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5zaG93ID0gdGhpcy5nZXRFZGl0b3IoKS5pc0FjdGl2ZShkaXNwbGF5Q29uZGl0aW9uKTtcbiAgICB9LFxuICAgIGVkaXRvcigpIHtcbiAgICAgIHRoaXMuZXZhbHVhdGVJZlNob3dpbmcoKTtcbiAgICAgIHJldHVybiB0aGlzLmdldEVkaXRvcigpO1xuICAgIH0sXG4gICAgZ2V0RWRpdG9yKCkge1xuICAgICAgcmV0dXJuIHdpbmRvdy50YWxsdGFwW3RoaXMuZWRpdG9yUmVmXTtcbiAgICB9LFxuICAgIGJ1YmJsZU1lbnVSZWY6IHtcbiAgICAgIFtcIngtaW5pdFwiXSgpIHtcbiAgICAgICAgdGhpcy5pbml0VGFsbHRhcCgpO1xuICAgICAgfSxcbiAgICAgIFtcIngtc2hvd1wiXSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hvdztcbiAgICAgIH0sXG4gICAgICBbXCJ4LW9uOnVwZGF0ZS53aW5kb3dcIl0oKSB7XG4gICAgICAgIHRoaXMuZXZhbHVhdGVJZlNob3dpbmcoKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn1cbiIsICJpbXBvcnQgeyBidWJibGVNZW51UmVmIH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcblxuKGZ1bmN0aW9uICgpIHtcbiAgdGhpcy50YWxsdGFwUmVnaXN0cnkgPSB7XG4gICAgaW5zdGFuY2VzOiBbXSxcbiAgICBnbG9iYWxFeHRlbnNpb25zOiBbXSxcbiAgICBpbml0KGluc3RhbmNlTmFtZSwgY29uZmlnKSB7XG4gICAgICBjb25zdCBpbnN0YW5jZSA9IHtcbiAgICAgICAgbmFtZTogaW5zdGFuY2VOYW1lLFxuICAgICAgICBjb25maWcsXG4gICAgICAgIGV4dGVuc2lvbnM6IFtdLFxuICAgICAgfTtcblxuICAgICAgZm9yIChjb25zdCB7IGlkLCBjYWxsYmFjayB9IG9mIHRoaXMuZ2xvYmFsRXh0ZW5zaW9ucykge1xuICAgICAgICBjb25zdCBib290ZWRFeHRlbnNpb24gPSBjYWxsYmFjayhpbnN0YW5jZSwgY29uZmlnW2lkXSA/PyBudWxsKTtcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShib290ZWRFeHRlbnNpb24pKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBleHRFbGVtZW50IG9mIGJvb3RlZEV4dGVuc2lvbikge1xuICAgICAgICAgICAgaW5zdGFuY2UuZXh0ZW5zaW9ucy5wdXNoKGV4dEVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnN0YW5jZS5leHRlbnNpb25zLnB1c2goZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmluc3RhbmNlcy5wdXNoKGluc3RhbmNlKTtcbiAgICB9LFxuICAgIHJlZ2lzdGVyKGlkLCBjYWxsYmFjaykge1xuICAgICAgdGhpcy5nbG9iYWxFeHRlbnNpb25zLnB1c2goe1xuICAgICAgICBpZCxcbiAgICAgICAgY2FsbGJhY2ssXG4gICAgICB9KTtcbiAgICB9LFxuICAgIGdldEluc3RhbmNlKGluc3RhbmNlTmFtZSkge1xuICAgICAgaWYgKHRoaXMuaW5zdGFuY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFRhbGxUYXAgaW5zdGFuY2UgJHtpbnN0YW5jZU5hbWV9IGhhc24ndCBiZWVuIGluaXRpYWxpemVkIHlldGBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlcy5maW5kKChpbnN0YW5jZSkgPT4gaW5zdGFuY2UubmFtZSA9PT0gaW5zdGFuY2VOYW1lKTtcbiAgICB9LFxuICAgIGdldENvbmZpZyhpbnN0YW5jZSwgZXh0ZW5zaW9uSWQgPSBudWxsKSB7XG4gICAgICBpZiAoZXh0ZW5zaW9uSWQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2UuY29uZmlnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGluc3RhbmNlLmNvbmZpZ1tleHRlbnNpb25JZF0gPz8gbnVsbDtcbiAgICB9LFxuICB9O1xufSkoKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5idWJibGVNZW51UmVmID0gYnViYmxlTWVudVJlZjtcbn0pKCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOztBQWNPLFdBQVMsY0FBYyxtQkFBbUIsUUFBVztBQUMxRCxXQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsTUFDWCxNQUFNLENBQUM7QUFBQSxNQUNQLGNBQWM7QUFDWixhQUFLLFlBQVksS0FBSyxJQUFJLGNBQWMsUUFBUTtBQUNoRCxhQUFLLGtCQUFrQjtBQUFBLE1BQ3pCO0FBQUEsTUFDQSxvQkFBb0I7QUFDbEIsWUFBSSxDQUFDLGtCQUFrQjtBQUNyQjtBQUFBLFFBQ0Y7QUFDQSxhQUFLLE9BQU8sS0FBSyxVQUFVLEVBQUUsU0FBUyxnQkFBZ0I7QUFBQSxNQUN4RDtBQUFBLE1BQ0EsU0FBUztBQUNQLGFBQUssa0JBQWtCO0FBQ3ZCLGVBQU8sS0FBSyxVQUFVO0FBQUEsTUFDeEI7QUFBQSxNQUNBLFlBQVk7QUFDVixlQUFPLE9BQU8sUUFBUSxLQUFLLFNBQVM7QUFBQSxNQUN0QztBQUFBLE1BQ0EsZUFBZTtBQUFBLFFBQ2IsQ0FBQyxRQUFRLElBQUk7QUFDWCxlQUFLLFlBQVk7QUFBQSxRQUNuQjtBQUFBLFFBQ0EsQ0FBQyxRQUFRLElBQUk7QUFDWCxpQkFBTyxLQUFLO0FBQUEsUUFDZDtBQUFBLFFBQ0EsQ0FBQyxvQkFBb0IsSUFBSTtBQUN2QixlQUFLLGtCQUFrQjtBQUFBLFFBQ3pCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGOzs7QUM3Q0EsR0FBQyxXQUFZO0FBQ1gsU0FBSyxrQkFBa0I7QUFBQSxNQUNyQixXQUFXLENBQUM7QUFBQSxNQUNaLGtCQUFrQixDQUFDO0FBQUEsTUFDbkIsS0FBSyxjQUFjLFFBQVE7QUFDekIsY0FBTSxXQUFXO0FBQUEsVUFDZixNQUFNO0FBQUEsVUFDTjtBQUFBLFVBQ0EsWUFBWSxDQUFDO0FBQUEsUUFDZjtBQUVBLG1CQUFXLEVBQUUsSUFBSSxTQUFTLEtBQUssS0FBSyxrQkFBa0I7QUFDcEQsZ0JBQU0sa0JBQWtCLFNBQVMsVUFBVSxPQUFPLEVBQUUsS0FBSyxJQUFJO0FBRTdELGNBQUksTUFBTSxRQUFRLGVBQWUsR0FBRztBQUNsQyx1QkFBVyxjQUFjLGlCQUFpQjtBQUN4Qyx1QkFBUyxXQUFXLEtBQUssVUFBVTtBQUFBLFlBQ3JDO0FBQUEsVUFDRixPQUFPO0FBQ0wscUJBQVMsV0FBVyxLQUFLLEdBQUc7QUFBQSxVQUM5QjtBQUFBLFFBQ0Y7QUFFQSxhQUFLLFVBQVUsS0FBSyxRQUFRO0FBQUEsTUFDOUI7QUFBQSxNQUNBLFNBQVMsSUFBSSxVQUFVO0FBQ3JCLGFBQUssaUJBQWlCLEtBQUs7QUFBQSxVQUN6QjtBQUFBLFVBQ0E7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUEsTUFDQSxZQUFZLGNBQWM7QUFDeEIsWUFBSSxLQUFLLFVBQVUsV0FBVyxHQUFHO0FBQy9CLGdCQUFNLElBQUk7QUFBQSxZQUNSLG9CQUFvQixZQUFZO0FBQUEsVUFDbEM7QUFBQSxRQUNGO0FBQ0EsZUFBTyxLQUFLLFVBQVUsS0FBSyxDQUFDLGFBQWEsU0FBUyxTQUFTLFlBQVk7QUFBQSxNQUN6RTtBQUFBLE1BQ0EsVUFBVSxVQUFVLGNBQWMsTUFBTTtBQUN0QyxZQUFJLGVBQWUsTUFBTTtBQUN2QixpQkFBTyxTQUFTO0FBQUEsUUFDbEI7QUFDQSxlQUFPLFNBQVMsT0FBTyxXQUFXLEtBQUs7QUFBQSxNQUN6QztBQUFBLElBQ0Y7QUFBQSxFQUNGLEdBQUc7QUFFSCxHQUFDLFdBQVk7QUFDWCxTQUFLLGdCQUFnQjtBQUFBLEVBQ3ZCLEdBQUc7IiwKICAibmFtZXMiOiBbXQp9Cg==
