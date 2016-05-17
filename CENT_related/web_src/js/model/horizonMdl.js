var Emitter = require('../core/emitter');

var emitter = new Emitter();
var horizon = null;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getHorizon: function() {
        return horizon;
    },
    setHorizon: function(value) {
        horizon = value;
        emitter.emit();
    }
};
