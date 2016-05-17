module.exports = {
    addCommas: function(value) {
        var x = value + "";
        var rgx = /(\d+)(\d{3})/;
        while(rgx.test(x)) {
            x = x.replace(rgx, "$1" + "," + "$2");
        }
        return x;
    }
};
