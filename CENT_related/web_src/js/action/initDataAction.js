var Dao = require('../core/dao');
var CoverageMdl = require('../model/coverageMdl');
var MetricMdl = require('../model/metricMdl');
var DateRangeMdl = require('../model/dateRangeMdl');
var OverviewDataMdl = require('../model/overviewDataMdl');
var StatusMdl = require('../model/statusMdl');
var HorizonMdl = require('../model/horizonMdl');
var PeriodMdl = require('../model/periodMdl');

var processOverviewData = function(data) {
    data.metricsNames = Object.keys(data.metrics);
    var firstMetric = data.metricsNames[0];
    //data.coverages = Object.keys(data.metrics[firstMetric]);
    data.coverages = ['Injury', 'BI', 'UBI', 'WBI', 'PIP/MPC', 'MPC', 'PIP', 'Property', 'COLL', 'COMP', 'PD'];
    var firstCoverage = data.coverages[0];
    var states = Object.keys(data.metrics[firstMetric][firstCoverage]);
    var firstState = states[0];
    data.numMonths = data.metrics[firstMetric][firstCoverage][firstState].length;
    data.startDate = (data.startYear - 1970) * 12 + data.startMonth; // #months since 1970
    data.startDateToShowOnTimeSlider = (2009 - 1970) * 12;
    data.startDateOffset = data.startDateToShowOnTimeSlider - data.startDate;
    if (data.startDateOffset < 0) data.startDateOffset = 0;
    data.startDate += data.startDateOffset;
    data.numMonths -= data.startDateOffset;
    data.horizons = [1, 6, 12];
    data.periods = ['R12', 'Monthly'];
};

module.exports = {
    exec: function(horizon, period) {
        Dao.getOverviewData(
            horizon,
            period,
            function(data) {
                processOverviewData(data);
                OverviewDataMdl.setData(data);
            },
            function(err) {
                console.log(err);
                StatusMdl.setError(err);
            }
        );
    }
};