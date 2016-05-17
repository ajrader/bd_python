var Emitter = require('../core/emitter');

var emitter = new Emitter();
var forecast = 'Off';

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getForecast: function() {
    return forecast;
  },
  setForecast: function(value) {
    forecast = value;
    emitter.emit();
  }
};
