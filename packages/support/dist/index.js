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
      "bubbleMenuRef": {
        ["x-init"]() {
          this.initTalltap();
        },
        ["x-show"]() {
          return this.show;
        },
        ["x-on:update.window"]() {
          this.evaluateIfShowing();
        }
      }
    };
  }

  // packages/support/resources/js/index.js
  (function() {
    this.talltapRegistry = {
      instances: [],
      globalExtensions: [],
      init(instanceName, config) {
        const instance = {
          name: instanceName,
          config,
          extensions: []
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
          callback
        });
      },
      getInstance(instanceName) {
        if (this.instances.length === 0) {
          throw new Error(`TallTap instance ${instanceName} hasn't been initialized yet`);
        }
        return this.instances.find((instance) => instance.name === instanceName);
      },
      getConfig(instance, extensionId = null) {
        if (extensionId == null) {
          return instance.config;
        }
        return instance.config[extensionId] ?? null;
      }
    };
  })();
  (function() {
    this.bubbleMenuRef = bubbleMenuRef;
  })();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vcmVzb3VyY2VzL2pzL3V0aWxzLmpzIiwgIi4uL3Jlc291cmNlcy9qcy9pbmRleC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRXh0ZW5zaW9uKGlkLCBjYWxsYmFjayl7XG4gICAgaWYgKGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaWQgY2FuJ3QgYmUgdW5kZWZpbmVkIHdoZW4gcmVnaXN0ZXJpbmcgYW4gZXh0ZW5zaW9uXCIpO1xuICAgIH1cbiAgICBpZiAoY2FsbGJhY2sgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYWxsYmFjayBjYW4ndCBiZSB1bmRlZmluZWQgd2hlbiByZWdpc3RlcmluZyBhbiBleHRlbnNpb25cIik7XG4gICAgfVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhbHBpbmU6aW5pdFwiLCAoKSA9PiB7XG4gICAgICAgIHdpbmRvdy50YWxsdGFwUmVnaXN0cnkucmVnaXN0ZXIoaWQsIGNhbGxiYWNrKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1YmJsZU1lbnVSZWYoZGlzcGxheUNvbmRpdGlvbiA9IHVuZGVmaW5lZCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZWRpdG9yUmVmOiB1bmRlZmluZWQsXG4gICAgICAgIHNob3c6ICFkaXNwbGF5Q29uZGl0aW9uLFxuICAgICAgICBpbml0VGFsbHRhcCgpIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yUmVmID0gdGhpcy4kZWwucGFyZW50RWxlbWVudC5kYXRhc2V0LmVkaXRvcjtcbiAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVJZlNob3dpbmcoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZXZhbHVhdGVJZlNob3dpbmcoKXtcbiAgICAgICAgICAgIGlmICghZGlzcGxheUNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2hvdyA9IHRoaXMuZ2V0RWRpdG9yKCkuaXNBY3RpdmUoZGlzcGxheUNvbmRpdGlvbik7XG4gICAgICAgIH0sXG4gICAgICAgIGVkaXRvcigpIHtcbiAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVJZlNob3dpbmcoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEVkaXRvcigpO1xuICAgICAgICB9LFxuICAgICAgICBnZXRFZGl0b3IoKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LnRhbGx0YXBbdGhpcy5lZGl0b3JSZWZdO1xuICAgICAgICB9LFxuICAgICAgICAnYnViYmxlTWVudVJlZic6IHtcbiAgICAgICAgICAgIFsneC1pbml0J10oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0VGFsbHRhcCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFsneC1zaG93J10oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2hvdztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbJ3gtb246dXBkYXRlLndpbmRvdyddKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXZhbHVhdGVJZlNob3dpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9XG59IiwgImltcG9ydCB7YnViYmxlTWVudVJlZn0gZnJvbSBcIi4vdXRpbHMuanNcIjtcblxuKGZ1bmN0aW9uKCkge1xuICAgIHRoaXMudGFsbHRhcFJlZ2lzdHJ5ID0ge1xuICAgICAgICBpbnN0YW5jZXM6IFtdLFxuICAgICAgICBnbG9iYWxFeHRlbnNpb25zOiBbXSxcbiAgICAgICAgaW5pdChpbnN0YW5jZU5hbWUsIGNvbmZpZykge1xuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSB7XG4gICAgICAgICAgICAgICAgbmFtZTogaW5zdGFuY2VOYW1lLFxuICAgICAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgICAgICBleHRlbnNpb25zOiBbXVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHtpZCwgY2FsbGJhY2t9IG9mIHRoaXMuZ2xvYmFsRXh0ZW5zaW9ucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJvb3RlZEV4dGVuc2lvbiA9IGNhbGxiYWNrKGluc3RhbmNlLCBjb25maWdbaWRdID8/IG51bGwpO1xuXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYm9vdGVkRXh0ZW5zaW9uKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGV4dEVsZW1lbnQgb2YgYm9vdGVkRXh0ZW5zaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS5leHRlbnNpb25zLnB1c2goZXh0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS5leHRlbnNpb25zLnB1c2goZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpXG4gICAgICAgIH0sXG4gICAgICAgIHJlZ2lzdGVyKGlkLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5nbG9iYWxFeHRlbnNpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrXG4gICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICBnZXRJbnN0YW5jZShpbnN0YW5jZU5hbWUpe1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5zdGFuY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGFsbFRhcCBpbnN0YW5jZSAke2luc3RhbmNlTmFtZX0gaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZXMuZmluZChpbnN0YW5jZSA9PiBpbnN0YW5jZS5uYW1lID09PSBpbnN0YW5jZU5hbWUpO1xuICAgICAgICB9LFxuICAgICAgICBnZXRDb25maWcoaW5zdGFuY2UsIGV4dGVuc2lvbklkID0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGV4dGVuc2lvbklkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5zdGFuY2UuY29uZmlnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlLmNvbmZpZ1tleHRlbnNpb25JZF0gPz8gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn0oKSk7XG5cbihmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJ1YmJsZU1lbnVSZWYgPSBidWJibGVNZW51UmVmO1xufSgpKTsiXSwKICAibWFwcGluZ3MiOiAiOztBQVlPLFdBQVMsY0FBYyxtQkFBbUIsUUFBVTtBQUN2RCxXQUFPO0FBQUEsTUFDSCxXQUFXO0FBQUEsTUFDWCxNQUFNLENBQUM7QUFBQSxNQUNQLGNBQWM7QUFDVixhQUFLLFlBQVksS0FBSyxJQUFJLGNBQWMsUUFBUTtBQUNoRCxhQUFLLGtCQUFrQjtBQUFBLE1BQzNCO0FBQUEsTUFDQSxvQkFBbUI7QUFDZixZQUFJLENBQUMsa0JBQWtCO0FBQ25CO0FBQUEsUUFDSjtBQUNBLGFBQUssT0FBTyxLQUFLLFVBQVUsRUFBRSxTQUFTLGdCQUFnQjtBQUFBLE1BQzFEO0FBQUEsTUFDQSxTQUFTO0FBQ0wsYUFBSyxrQkFBa0I7QUFDdkIsZUFBTyxLQUFLLFVBQVU7QUFBQSxNQUMxQjtBQUFBLE1BQ0EsWUFBWTtBQUNSLGVBQU8sT0FBTyxRQUFRLEtBQUssU0FBUztBQUFBLE1BQ3hDO0FBQUEsTUFDQSxpQkFBaUI7QUFBQSxRQUNiLENBQUMsUUFBUSxJQUFJO0FBQ1QsZUFBSyxZQUFZO0FBQUEsUUFDckI7QUFBQSxRQUNBLENBQUMsUUFBUSxJQUFJO0FBQ1QsaUJBQU8sS0FBSztBQUFBLFFBQ2hCO0FBQUEsUUFDQSxDQUFDLG9CQUFvQixJQUFJO0FBQ3JCLGVBQUssa0JBQWtCO0FBQUEsUUFDM0I7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLEVBQ0o7OztBQzNDQSxHQUFDLFdBQVc7QUFDUixTQUFLLGtCQUFrQjtBQUFBLE1BQ25CLFdBQVcsQ0FBQztBQUFBLE1BQ1osa0JBQWtCLENBQUM7QUFBQSxNQUNuQixLQUFLLGNBQWMsUUFBUTtBQUN2QixjQUFNLFdBQVc7QUFBQSxVQUNiLE1BQU07QUFBQSxVQUNOO0FBQUEsVUFDQSxZQUFZLENBQUM7QUFBQSxRQUNqQjtBQUVBLG1CQUFXLEVBQUMsSUFBSSxTQUFRLEtBQUssS0FBSyxrQkFBa0I7QUFDaEQsZ0JBQU0sa0JBQWtCLFNBQVMsVUFBVSxPQUFPLEVBQUUsS0FBSyxJQUFJO0FBRTdELGNBQUksTUFBTSxRQUFRLGVBQWUsR0FBRztBQUNoQyx1QkFBVyxjQUFjLGlCQUFpQjtBQUN0Qyx1QkFBUyxXQUFXLEtBQUssVUFBVTtBQUFBLFlBQ3ZDO0FBQUEsVUFDSixPQUFPO0FBQ0gscUJBQVMsV0FBVyxLQUFLLEdBQUc7QUFBQSxVQUNoQztBQUFBLFFBQ0o7QUFFQSxhQUFLLFVBQVUsS0FBSyxRQUFRO0FBQUEsTUFDaEM7QUFBQSxNQUNBLFNBQVMsSUFBSSxVQUFVO0FBQ25CLGFBQUssaUJBQWlCLEtBQUs7QUFBQSxVQUN2QjtBQUFBLFVBQ0E7QUFBQSxRQUNKLENBQUM7QUFBQSxNQUNMO0FBQUEsTUFDQSxZQUFZLGNBQWE7QUFDckIsWUFBSSxLQUFLLFVBQVUsV0FBVyxHQUFHO0FBQzdCLGdCQUFNLElBQUksTUFBTSxvQkFBb0IsWUFBWSw4QkFBOEI7QUFBQSxRQUNsRjtBQUNBLGVBQU8sS0FBSyxVQUFVLEtBQUssY0FBWSxTQUFTLFNBQVMsWUFBWTtBQUFBLE1BQ3pFO0FBQUEsTUFDQSxVQUFVLFVBQVUsY0FBYyxNQUFNO0FBQ3BDLFlBQUksZUFBZSxNQUFNO0FBQ3JCLGlCQUFPLFNBQVM7QUFBQSxRQUNwQjtBQUNBLGVBQU8sU0FBUyxPQUFPLFdBQVcsS0FBSztBQUFBLE1BQzNDO0FBQUEsSUFDSjtBQUFBLEVBQ0osR0FBRTtBQUVGLEdBQUMsV0FBVztBQUNSLFNBQUssZ0JBQWdCO0FBQUEsRUFDekIsR0FBRTsiLAogICJuYW1lcyI6IFtdCn0K
