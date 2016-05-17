var Emitter = require('../core/emitter');

var emitter = new Emitter();
var metric = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getMetric: function() {
    return metric;
  },
  setMetric: function(value) {
    metric = value;
    emitter.emit();
  }
};
