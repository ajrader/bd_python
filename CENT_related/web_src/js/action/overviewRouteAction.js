var CoverageMdl = require('../model/coverageMdl');
var MetricMdl = require('../model/metricMdl');
var DateRangeMdl = require('../model/dateRangeMdl');
var OverviewDataMdl = require('../model/overviewDataMdl');
var SelectStateAction = require('./selectStateAction');
var HorizonMdl = require('../model/horizonMdl');
var PeriodMdl = require('../model/periodMdl');

module.exports = {
    exec: function(params) {

        // set model to match params in the route, otherwise to default values
    
        SelectStateAction.exec(null, null, null);
        var data = OverviewDataMdl.getData();

        if(params.coverage) CoverageMdl.setCoverage(params.coverage);
        else if(data) CoverageMdl.setCoverage(data.coverages[0]);

        if(params.metric) MetricMdl.setMetric(params.metric);
        else if(data) MetricMdl.setMetric(data.metricsNames[0]);
        
        if(params.horizon) HorizonMdl.setHorizon(params.horizon);
        else if(data) HorizonMdl.setHorizon(1);
        
        if(params.period) PeriodMdl.setPeriod(params.period);
        else if(data) PeriodMdl.setPeriod('R12');

        if(params.dateRangeStart && params.dateRangeSz) {
            DateRangeMdl.setRange(+params.dateRangeStart, +params.dateRangeSz);
        } else if(data) {
            DateRangeMdl.setRangeStart(data.startDate + data.numMonths - DateRangeMdl.getRangeSize());
        }
    }
};