var Emitter = require('../core/emitter');

var emitter = new Emitter();
var state = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  isStateSelected: function() {
    return state !== null;
  },
  getState: function() {
    return state;
  },
  setState: function(value) {
    state = value;
    emitter.emit();
  }
};
