var CoverageMdl = require('../model/coverageMdl');
var StateViewMdl = require('../model/stateViewMdl');
var OverviewDataMdl = require('../model/overviewDataMdl');
var SelectStateAction = require('./selectStateAction');
var MetricMdl = require('../model/metricMdl');
var DateRangeMdl = require('../model/dateRangeMdl');
var HorizonMdl = require('../model/horizonMdl');
var PeriodMdl = require('../model/periodMdl');

module.exports = {
    exec: function(params) {
        // set model to match params in the route, otherwise to default values

        if(params.horizon) HorizonMdl.setHorizon(params.horizon);
        else if(data) HorizonMdl.setHorizon(1);
        
        if(params.period) PeriodMdl.setPeriod(params.period);
        else if(data) PeriodMdl.setPeriod('R12');
        
        var horizon = HorizonMdl.getHorizon();
        var period = PeriodMdl.getPeriod();
        
        SelectStateAction.exec(horizon, period, params.state);
        var data = OverviewDataMdl.getData();

        if(params.coverage) CoverageMdl.setCoverage(params.coverage);
        else if(data) CoverageMdl.setCoverage(data.coverages[0]);

        if(params.view) StateViewMdl.setStateView(params.view);
        else StateViewMdl.setStateView(StateViewMdl.ViewState.CHARTS);

        // ensure other models are set to default values
        if(data) {
            MetricMdl.setMetric(data.metricsNames[0]);
            DateRangeMdl.setRangeStart(data.startDate + data.numMonths - DateRangeMdl.getRangeSize());
        }
    }
};