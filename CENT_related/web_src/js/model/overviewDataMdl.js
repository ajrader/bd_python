var Emitter = require('../core/emitter');

var emitter = new Emitter();
var odata = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  hasData: function() {
    return odata !== null;
  },
  getData: function() {
    return odata;
  },
  setData: function(value) {
    odata = value;
    emitter.emit();
  }
};
