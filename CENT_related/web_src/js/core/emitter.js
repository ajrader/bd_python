function Emitter(debugPrefix) {
    this.callbacks = [];
    this.debugPrefix = debugPrefix;
}
Emitter.prototype.register = function(callback) {
    this.callbacks.push(callback);
    if(this.debugPrefix) console.log(this.debugPrefix + ': added callback ' + callback);
};
Emitter.prototype.unregister = function(callback) {
    var idx = this.callbacks.indexOf(callback);
    if(idx >= 0) {
        this.callbacks.splice(idx, 1);
        if(this.debugPrefix) console.log(this.debugPrefix + ': removed callback ' + callback);
    } else {
        if(this.debugPrefix) console.log(this.debugPrefix + ': did not find callback ' + callback);
    }
};
Emitter.prototype.emit = function() {
    if(this.debugPrefix) console.log(this.debugPrefix + ': emit to ' + this.callbacks.length + ' callbacks');
    this.callbacks.forEach(function(cb) { cb(); });
};

module.exports = Emitter;