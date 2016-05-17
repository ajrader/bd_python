var Emitter = require('../core/emitter');

var emitter = new Emitter();
var rangeStart = -1;
var rangeSize = 1;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getRangeStart: function() {
        return rangeStart;
    },
    getRangeSize: function() {
        return rangeSize;
    },
    setRange: function(startValue, sizeValue) {
        rangeStart = startValue;
        rangeSize = sizeValue;
        emitter.emit();
    },
    setRangeStart: function(value) {
        rangeStart = value;
        emitter.emit();
    },
    setRangeSize: function(value) {
        rangeSize = value;
        emitter.emit();
    }
};
