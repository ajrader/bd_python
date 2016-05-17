var SuperAgent = window.superagent;

module.exports = {
    getOverviewData: function(horizon, period, successCb, failureCb) {
        SuperAgent.get('overview?horizon=' + horizon + '&period=' + period).end(function(err, resp) {
            if(err) failureCb(err);
            else if(resp.error) failureCb(resp.error);
            else successCb(resp.body);
        });
    },
    getDetailData: function(horizon, period, state, successCb, failureCb) {
        SuperAgent.get('detail?horizon=' + horizon + '&period=' + period + '&state=' + state).end(function(err, resp) {
            if(err) failureCb(err);
            else if(resp.error) failureCb(resp.error);
            else successCb(resp.body);
        });
    }
};
