var Dao = require('../core/dao');
var StateMdl = require('../model/stateMdl');
var DetailDataMdl = require('../model/detailDataMdl');
var StatusMdl = require('../model/statusMdl');
var States = require('../model/states');

var loadDetailData = function(horizon, period, state) {
    Dao.getDetailData(
        horizon,
        period,
        state.toUpperCase(),
        function(data) {
            DetailDataMdl.setData(data);
        },
        function(err) {
            StatusMdl.setError(err);
        }
    );
};

module.exports = {
    exec: function(horizon, period, state) {
        DetailDataMdl.setData(null);
        StateMdl.setState(state);
        if(state !== null) {
            window.scrollTo(0,0);
            loadDetailData(horizon, period, States[state]);
        }
    }
};