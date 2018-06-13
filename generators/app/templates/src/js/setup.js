require("core-js/es6/promise");
require("core-js/fn/object/assign");
require("core-js/fn/object/entries");
require("core-js/fn/object/values");
const main = require("./app");

const setup = function() {
  if (NodeList.prototype.forEach === undefined) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

  (function () {
    var throttle = function (type, name, obj) {
      obj = obj || window;
      var running = false;
      var func = function () {
        if (running) {
          return;
        }
        running = true;
        requestAnimationFrame(function () {
          obj.dispatchEvent(new CustomEvent(name));
          running = false;
        });
      };
      obj.addEventListener(type, func);
    };

    throttle('resize', 'optimizedResize');
  })();

  if (module.hot) {
    console.log("hot");
    module.hot.accept('./app', () => {
      console.log("HMR accepting app");
      main();
    });
  }  
};

module.exports = setup;
