var Router = require('./core/router');
var OverviewRouteAction = require('./action/overviewRouteAction');
var DetailRouteAction = require('./action/detailRouteAction');
var CoverageMdl = require('./model/coverageMdl');
var MetricMdl = require('./model/metricMdl');
var DateRangeMdl = require('./model/dateRangeMdl');
var StateViewMdl = require('./model/stateViewMdl');
var StateMdl = require('./model/stateMdl');
var OverviewDataMdl = require('./model/overviewDataMdl');
var HorizonMdl = require('./model/horizonMdl');
var PeriodMdl = require('./model/periodMdl');

var routeChanging = false;

var routeChanged = function() {
    routeChanging = true;

    var route = Router.getRoute();

    var paramStr = '';
    var idx = route.indexOf('?');
    if(idx > 0 && idx < route.length - 1) paramStr = route.slice(idx + 1);
    var params = parseParams(decodeURI(paramStr));
    if(route.indexOf('#/detail') === 0) DetailRouteAction.exec(params);
    else if(route.indexOf('#/overview') === 0) OverviewRouteAction.exec(params);
    else setTimeout(function() { redirectToDefault(); }, 1); // if not recognized, set to default route
    routeChanging = false;
};

var redirectToDefault = function() {
    Router.setRoute('#/overview');
    routeChanged();
};

var dataLoaded = function() {
    // when data is initially loaded, handle route change event again
    if(Router.getRoute().startsWith('#/overview')) routeChanged();
};

var parseParams = function(paramStr) {
    var params = {};
    paramStr.split('&').forEach(function(item) {
        var queryParam = item.split('=');
        params[queryParam[0]] = queryParam[1];
    });
    return params;
};

var modelChanged = function() {
    if(routeChanging) return;
    var route = '';
    var params = '';
    if(StateMdl.getState()) {
        route = '#/detail';
        if(StateMdl.getState()) params += '&state=' + StateMdl.getState();
        if(CoverageMdl.getCoverage()) params += '&coverage=' + CoverageMdl.getCoverage();
        if(StateViewMdl.getStateView()) params += '&view=' + StateViewMdl.getStateView();
        if(HorizonMdl.getHorizon()) params += '&horizon=' + HorizonMdl.getHorizon();
        if(PeriodMdl.getPeriod()) params += '&period=' + PeriodMdl.getPeriod();
    } else {
        route = '#/overview';
        if(CoverageMdl.getCoverage()) params += '&coverage=' + CoverageMdl.getCoverage();
        if(MetricMdl.getMetric()) params += '&metric=' + MetricMdl.getMetric();
        if(HorizonMdl.getHorizon()) params += '&horizon=' + HorizonMdl.getHorizon();
        if(PeriodMdl.getPeriod()) params += '&period=' + PeriodMdl.getPeriod();
        if(DateRangeMdl.getRangeStart() > 0) {
            params += '&dateRangeStart=' + DateRangeMdl.getRangeStart();
            params += '&dateRangeSz=' + DateRangeMdl.getRangeSize();
        }
    }
    params = encodeURI(params);
    if(params.length > 0) route += '?' + params.slice(1);
    Router.setRoute(route);
};

module.exports = {
    init: function() {
        Router.onChange(routeChanged);
        // when data initially loaded update models to match route, in case we need
        // default values for some models
        OverviewDataMdl.onChange(routeChanged);
        CoverageMdl.onChange(modelChanged);
        MetricMdl.onChange(modelChanged);
        DateRangeMdl.onChange(modelChanged);
        StateMdl.onChange(modelChanged);
        StateViewMdl.onChange(modelChanged);
        HorizonMdl.onChange(modelChanged);
        PeriodMdl.onChange(modelChanged);
        Router.start();
        routeChanged();
    }
};
