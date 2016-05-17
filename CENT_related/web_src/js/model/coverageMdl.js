var Emitter = require('../core/emitter');

var emitter = new Emitter();
var coverage = null;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getCoverage: function() {
        return coverage;
    },
    setCoverage: function(value) {
        coverage = value;
        emitter.emit();
    }
};
