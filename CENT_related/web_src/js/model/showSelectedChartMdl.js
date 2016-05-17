var Emitter = require('../core/emitter');

var emitter = new Emitter();
var showSelectedChart = 'Off';

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getShowSelectedChart: function() {
    return showSelectedChart;
  },
  setShowSelectedChart: function(value) {
    showSelectedChart = value;
    emitter.emit();
  }
};