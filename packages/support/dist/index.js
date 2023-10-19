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
      extensions: [],
      config: void 0,
      init(config) {
        this.config = config;
      },
      register(extension) {
        if (!this.config) {
          throw new Error("TallTap registry hasn't been initialized yet");
        }
        this.extensions.push(extension);
      },
      getExtensions() {
        if (!this.config) {
          throw new Error("TallTap registry hasn't been initialized yet");
        }
        return this.extensions;
      },
      getConfig(extensionId = null) {
        if (!this.config) {
          throw new Error("TallTap registry hasn't been initialized yet");
        }
        if (extensionId == null) {
          return this.config;
        }
        return this.config[extensionId] ?? null;
      }
    };
  })();
  (function() {
    this.bubbleMenuRef = bubbleMenuRef;
  })();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vcmVzb3VyY2VzL2pzL3V0aWxzLmpzIiwgIi4uL3Jlc291cmNlcy9qcy9pbmRleC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRXh0ZW5zaW9uKGlkLCBjYWxsYmFjayl7XG4gICAgaWYgKGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaWQgY2FuJ3QgYmUgdW5kZWZpbmVkIHdoZW4gcmVnaXN0ZXJpbmcgYW4gZXh0ZW5zaW9uXCIpO1xuICAgIH1cbiAgICBpZiAoY2FsbGJhY2sgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYWxsYmFjayBjYW4ndCBiZSB1bmRlZmluZWQgd2hlbiByZWdpc3RlcmluZyBhbiBleHRlbnNpb25cIik7XG4gICAgfVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhbHBpbmU6aW5pdFwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGV4dCA9IGNhbGxiYWNrKHdpbmRvdy50YWxsdGFwUmVnaXN0cnkuZ2V0Q29uZmlnKGlkKSk7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGV4dCkpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZXh0RWxlbWVudCBvZiBleHQpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cudGFsbHRhcFJlZ2lzdHJ5LnJlZ2lzdGVyKGV4dEVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LnRhbGx0YXBSZWdpc3RyeS5yZWdpc3RlcihleHQpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWJibGVNZW51UmVmKGRpc3BsYXlDb25kaXRpb24gPSB1bmRlZmluZWQpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGVkaXRvclJlZjogdW5kZWZpbmVkLFxuICAgICAgICBzaG93OiAhZGlzcGxheUNvbmRpdGlvbixcbiAgICAgICAgaW5pdFRhbGx0YXAoKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvclJlZiA9IHRoaXMuJGVsLnBhcmVudEVsZW1lbnQuZGF0YXNldC5lZGl0b3I7XG4gICAgICAgICAgICB0aGlzLmV2YWx1YXRlSWZTaG93aW5nKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGV2YWx1YXRlSWZTaG93aW5nKCl7XG4gICAgICAgICAgICBpZiAoIWRpc3BsYXlDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNob3cgPSB0aGlzLmdldEVkaXRvcigpLmlzQWN0aXZlKGRpc3BsYXlDb25kaXRpb24pO1xuICAgICAgICB9LFxuICAgICAgICBlZGl0b3IoKSB7XG4gICAgICAgICAgICB0aGlzLmV2YWx1YXRlSWZTaG93aW5nKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRFZGl0b3IoKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0RWRpdG9yKCkge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy50YWxsdGFwW3RoaXMuZWRpdG9yUmVmXTtcbiAgICAgICAgfSxcbiAgICAgICAgJ2J1YmJsZU1lbnVSZWYnOiB7XG4gICAgICAgICAgICBbJ3gtaW5pdCddKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdFRhbGx0YXAoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBbJ3gtc2hvdyddKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNob3c7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgWyd4LW9uOnVwZGF0ZS53aW5kb3cnXSgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV2YWx1YXRlSWZTaG93aW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfVxufSIsICJpbXBvcnQge2J1YmJsZU1lbnVSZWZ9IGZyb20gXCIuL3V0aWxzLmpzXCI7XG5cbihmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRhbGx0YXBSZWdpc3RyeSA9IHtcbiAgICAgICAgZXh0ZW5zaW9uczogW10sXG4gICAgICAgIGNvbmZpZzogdW5kZWZpbmVkLFxuICAgICAgICBpbml0KGNvbmZpZykge1xuICAgICAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIH0sXG4gICAgICAgIHJlZ2lzdGVyKGV4dGVuc2lvbikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbmZpZykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRhbGxUYXAgcmVnaXN0cnkgaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5leHRlbnNpb25zLnB1c2goZXh0ZW5zaW9uKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0RXh0ZW5zaW9ucygpe1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbmZpZykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRhbGxUYXAgcmVnaXN0cnkgaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5zaW9ucztcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0Q29uZmlnKGV4dGVuc2lvbklkID0gbnVsbCl7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGFsbFRhcCByZWdpc3RyeSBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXh0ZW5zaW9uSWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ1tleHRlbnNpb25JZF0gPz8gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn0oKSk7XG5cbihmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJ1YmJsZU1lbnVSZWYgPSBidWJibGVNZW51UmVmO1xufSgpKTsiXSwKICAibWFwcGluZ3MiOiAiOztBQW1CTyxXQUFTLGNBQWMsbUJBQW1CLFFBQVU7QUFDdkQsV0FBTztBQUFBLE1BQ0gsV0FBVztBQUFBLE1BQ1gsTUFBTSxDQUFDO0FBQUEsTUFDUCxjQUFjO0FBQ1YsYUFBSyxZQUFZLEtBQUssSUFBSSxjQUFjLFFBQVE7QUFDaEQsYUFBSyxrQkFBa0I7QUFBQSxNQUMzQjtBQUFBLE1BQ0Esb0JBQW1CO0FBQ2YsWUFBSSxDQUFDLGtCQUFrQjtBQUNuQjtBQUFBLFFBQ0o7QUFDQSxhQUFLLE9BQU8sS0FBSyxVQUFVLEVBQUUsU0FBUyxnQkFBZ0I7QUFBQSxNQUMxRDtBQUFBLE1BQ0EsU0FBUztBQUNMLGFBQUssa0JBQWtCO0FBQ3ZCLGVBQU8sS0FBSyxVQUFVO0FBQUEsTUFDMUI7QUFBQSxNQUNBLFlBQVk7QUFDUixlQUFPLE9BQU8sUUFBUSxLQUFLLFNBQVM7QUFBQSxNQUN4QztBQUFBLE1BQ0EsaUJBQWlCO0FBQUEsUUFDYixDQUFDLFFBQVEsSUFBSTtBQUNULGVBQUssWUFBWTtBQUFBLFFBQ3JCO0FBQUEsUUFDQSxDQUFDLFFBQVEsSUFBSTtBQUNULGlCQUFPLEtBQUs7QUFBQSxRQUNoQjtBQUFBLFFBQ0EsQ0FBQyxvQkFBb0IsSUFBSTtBQUNyQixlQUFLLGtCQUFrQjtBQUFBLFFBQzNCO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxFQUNKOzs7QUNsREEsR0FBQyxXQUFXO0FBQ1IsU0FBSyxrQkFBa0I7QUFBQSxNQUNuQixZQUFZLENBQUM7QUFBQSxNQUNiLFFBQVE7QUFBQSxNQUNSLEtBQUssUUFBUTtBQUNULGFBQUssU0FBUztBQUFBLE1BQ2xCO0FBQUEsTUFDQSxTQUFTLFdBQVc7QUFDaEIsWUFBSSxDQUFDLEtBQUssUUFBUTtBQUNkLGdCQUFNLElBQUksTUFBTSw4Q0FBOEM7QUFBQSxRQUNsRTtBQUNBLGFBQUssV0FBVyxLQUFLLFNBQVM7QUFBQSxNQUNsQztBQUFBLE1BQ0EsZ0JBQWU7QUFDWCxZQUFJLENBQUMsS0FBSyxRQUFRO0FBQ2QsZ0JBQU0sSUFBSSxNQUFNLDhDQUE4QztBQUFBLFFBQ2xFO0FBQ0EsZUFBTyxLQUFLO0FBQUEsTUFDaEI7QUFBQSxNQUNBLFVBQVUsY0FBYyxNQUFLO0FBQ3pCLFlBQUksQ0FBQyxLQUFLLFFBQVE7QUFDZCxnQkFBTSxJQUFJLE1BQU0sOENBQThDO0FBQUEsUUFDbEU7QUFDQSxZQUFJLGVBQWUsTUFBTTtBQUNyQixpQkFBTyxLQUFLO0FBQUEsUUFDaEI7QUFDQSxlQUFPLEtBQUssT0FBTyxXQUFXLEtBQUs7QUFBQSxNQUN2QztBQUFBLElBQ0o7QUFBQSxFQUNKLEdBQUU7QUFFRixHQUFDLFdBQVc7QUFDUixTQUFLLGdCQUFnQjtBQUFBLEVBQ3pCLEdBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
