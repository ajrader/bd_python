var Emitter = require('../core/emitter');

var emitter = new Emitter();
var err = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getError: function() {
    return err;
  },
  setError: function(value) {
    err = value;
    emitter.emit();
  }
};
