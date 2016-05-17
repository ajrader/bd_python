var Emitter = require('./emitter');

var emitter = new Emitter();

var addHashListener = function() {
    window.addEventListener("hashchange", handleHashChange, false);
};

var removeHashListener = function() {
    window.removeEventListener("hashchange", handleHashChange);
};

var handleHashChange = function() {
    if(document.activeElement !== document.body) {
        // clear the focus on hash change
        if(document.activeElement) document.activeElement.blur();
    }
    emitter.emit();
};

module.exports = {
    start: function() {
        addHashListener();
    },
    stop: function() {
        removeHashListener();
    },
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    setRoute: function(route) {
        removeHashListener();
        window.location.hash = route;
        setTimeout(function() { addHashListener(); }, 1);
    },
    getRoute: function() {
        return window.location.hash;
    }
};