var Emitter = require('../core/emitter');

var emitter = new Emitter();
var stateView = 'Charts';

module.exports = {
  ViewState: Object.freeze({
    CHARTS: 'Charts',
    TABLE: 'Table'
  }),
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getStateView: function() {
    return stateView;
  },
  setStateView: function(value) {
    stateView = value;
    emitter.emit();
  }
};
