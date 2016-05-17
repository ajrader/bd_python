var Emitter = require('../core/emitter');

var emitter = new Emitter();
var period = null;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getPeriod: function() {
        return period;
    },
    setPeriod: function(value) {
        period = value;
        emitter.emit();
    }
};
