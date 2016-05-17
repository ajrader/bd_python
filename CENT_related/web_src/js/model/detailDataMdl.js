var Emitter = require('../core/emitter');

var emitter = new Emitter();
var data = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  hasData: function() {
    return data !== null;
  },
  getData: function() {
    return data;
  },
  setData: function(value) {
    data = value;
    emitter.emit();
  }
};
