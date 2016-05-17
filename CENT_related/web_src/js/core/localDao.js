var SuperAgent = window.superagent;

module.exports = {
    getOverviewData: function(successCb, failureCb) {
        SuperAgent.get('overview.json').end(function(err, resp) {
            if(err) failureCb(err);
            else if(resp.error) failureCb(resp.error);
            else {
                successCb(resp.body);
            }
        });
    },
    getDetailData: function(state, successCb, failureCb) {
        SuperAgent.get('detail.json').end(function(err, resp) {
            if(err) console.log(err);
            else if(resp.error) console.log(resp.error);
            else {
                successCb(resp.body[state]);
            }
        });
    }
};
