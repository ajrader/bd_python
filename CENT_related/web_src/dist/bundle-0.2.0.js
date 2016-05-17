(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
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
},{"../model/coverageMdl":18,"../model/dateRangeMdl":19,"../model/horizonMdl":22,"../model/metricMdl":23,"../model/overviewDataMdl":24,"../model/periodMdl":25,"../model/stateViewMdl":28,"./selectStateAction":4}],2:[function(require,module,exports){
"use strict";
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
    // if (PeriodMdl.getPeriod() == 'R12') data.startDate += 11;
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
},{"../core/dao":13,"../model/coverageMdl":18,"../model/dateRangeMdl":19,"../model/horizonMdl":22,"../model/metricMdl":23,"../model/overviewDataMdl":24,"../model/periodMdl":25,"../model/statusMdl":30}],3:[function(require,module,exports){
"use strict";
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
},{"../model/coverageMdl":18,"../model/dateRangeMdl":19,"../model/horizonMdl":22,"../model/metricMdl":23,"../model/overviewDataMdl":24,"../model/periodMdl":25,"./selectStateAction":4}],4:[function(require,module,exports){
"use strict";
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
},{"../core/dao":13,"../model/detailDataMdl":20,"../model/stateMdl":27,"../model/states":29,"../model/statusMdl":30}],5:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */
var OverviewPg = require('./view/overviewPg');
var DetailPg = require('./view/detailPg');
var AppRouter = require('./appRouter');
var StateMdl = require('./model/stateMdl');
var InitDataAction = require('./action/initDataAction');
var SelectStateAction = require('./action/selectStateAction');
var PeriodMdl = require('./model/periodMdl');

var App = React.createClass({displayName: 'App',

    render: function() {
        return (
            /*jshint ignore:start */
            React.DOM.div(null,  this.state.selectedState === null ? OverviewPg(null) : DetailPg(null))
            /*jshint ignore:end */
        );
    },
    componentWillMount: function() {
        StateMdl.onChange(this.onStateChange);
        AppRouter.init();
    },
    componentDidMount: function() {
        PeriodMdl.setPeriod('R12');
        InitDataAction.exec(1, 'R12');
    },
    getInitialState: function() {
        return {
            selectedState: null
        };
    },
    onStateChange: function() {
        this.setState({
            selectedState: StateMdl.getState()
        });
    }
});

React.renderComponent(
    /*jshint ignore:start */
    App(null),
    /*jshint ignore:end */
    document.body
);

},{"./action/initDataAction":2,"./action/selectStateAction":4,"./appRouter":6,"./model/periodMdl":25,"./model/stateMdl":27,"./view/detailPg":33,"./view/overviewPg":34}],6:[function(require,module,exports){
"use strict";
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

},{"./action/detailRouteAction":1,"./action/overviewRouteAction":3,"./core/router":16,"./model/coverageMdl":18,"./model/dateRangeMdl":19,"./model/horizonMdl":22,"./model/metricMdl":23,"./model/overviewDataMdl":24,"./model/periodMdl":25,"./model/stateMdl":27,"./model/stateViewMdl":28}],7:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */

module.exports = React.createClass({displayName: 'AppHeader',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable.isRequired,
        onShowAbout: React.PropTypes.func
    },

    render: function() {
        return (
            /*jshint ignore:start */
            React.DOM.div({className: "apphdr", id: this.props.id}, 
                React.DOM.p({className: "apphdr-title"}, this.props.title), 
                React.DOM.a({className: "apphdr-about", href: "#", onClick: this.showAbout}, "About")
            )
            /*jshint ignore:end */
        );
    },

    showAbout: function() {
        this.props.onShowAbout();
        return false;
    }
});

},{}],8:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */

module.exports = React.createClass({displayName: 'DropdownChooser',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable,
        items: React.PropTypes.arrayOf(React.PropTypes.renderable),
        selectedItem: React.PropTypes.renderable,
        onItemSelect: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            items: [],
            selectedItem: 'Click to Select'
        };
    },

    // TODO: add key event handling (see Bootstrap dropdown)
    // enter to show popup
    // up/down arrow to traverse items
    // enter to select item
    // esc to close popup

    render: function() {
        var that = this;
        var listItems = this.props.items.map(function(item) {
            /*jshint ignore:start */
            return React.DOM.li({className: "ddchooser-item", key: item, onClick: that.selectItem.bind(that, item)}, React.DOM.a({href: "#"}, item));
            /*jshint ignore:end */
        });

        return (
            /*jshint ignore:start */
            React.DOM.div({id: this.props.id}, 
                React.DOM.p({className: "section-title"}, this.props.title), 
                React.DOM.a({href: "#", className: "ddchooser-toggle", onClick: this.toggleExpand}, 
                    React.DOM.span({className: "ddchooser-toggle-name"}, this.props.selectedItem), 
                    React.DOM.span({className: "ddchooser-toggle-icon fa fa-caret-down"})
                ), 
                React.DOM.ul({className: this.state.expanded ? 'ddchooser-popup' : 'ddchooser-popup hidden'}, listItems)
            )
            /*jshint ignore:end */
        );
    },

    getInitialState: function() {
        return {
            expanded: false
        };
    },
    componentDidMount: function() {
        window.addEventListener('click', this.globalClick);
    },
    componentWillUnmount: function() {
        window.removeEventListener('click', this.globalClick);
    },

    toggleExpand: function(e) {
        var newVal = !this.state.expanded;
        this.setState({
            expanded: newVal
        });
        return false;
    },

    globalClick: function(e) {
        if(this.state.expanded) this.toggleExpand();
    },

    selectItem: function(item) {
        this.setState({
            expanded: false
        });
        this.props.onItemSelect(item);
        return false;
    }
});

},{}],9:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */

module.exports = React.createClass({displayName: 'Legend',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable,
        categories: React.PropTypes.arrayOf(React.PropTypes.shape(
            {
                name: React.PropTypes.renderable,
                color: React.PropTypes.renderable,
                borderColor: React.PropTypes.renderable
            }  
        )),
        hasMargins: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            title: 'Legend',
            categories: [],
            hasMargins: true
        };
    },

    render: function() {
        if (this.props.hasMargins) {
            
            var categoryItems = this.props.categories.map(function(cat) {
                var colorStyle = { background: cat.color, border: '1px solid ' + cat.borderColor };

                /*jshint ignore:start */
                return React.DOM.li({className: "legend-item", key: cat.name}, 
                    React.DOM.span({className: "legend-color", style: colorStyle}), 
                    React.DOM.span({className: "legend-name"}, cat.name)
                )
                /*jshint ignore:end */
            });
            return (
                /*jshint ignore:start */
                React.DOM.div({id: this.props.id}, 
                    React.DOM.p({className: "section-title"}, this.props.title), 
                    React.DOM.ul({className: "legend-area"}, categoryItems)
                )
                /*jshint ignore:end */
            );
            
        } else {
            
            var categoryItems = [];
            for (var i=0; i<this.props.categories.length; i++) {
                var cat = this.props.categories[i];
                var colorStyle = { background: cat.color, border: '1px solid ' + cat.borderColor };
                
                if (i==0) var className = 'legend-color-no-margin-top';
                else if (i==this.props.categories.length-1) var className = 'legend-color-no-margin-bottom';
                else var className = 'legend-color-no-margin-middle';
                
                categoryItems.push(
                    /*jshint ignore:start */
                    React.DOM.li({className: "legend-item-no-margin", key: cat.name}, 
                        React.DOM.span({className: className, style: colorStyle}), 
                        React.DOM.span({className: "legend-name"}, cat.name)
                    )
                    /*jshint ignore:end */
                );
            }
            return (
                /*jshint ignore:start */
                React.DOM.div({id: this.props.id}, 
                    React.DOM.p({className: "section-title"}, this.props.title), 
                    React.DOM.ul({className: "legend-area"}, categoryItems)
                )
                /*jshint ignore:end */
            );
            
        }
    }
});

},{}],10:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */

module.exports = React.createClass({displayName: 'ListChooser',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable,
        items: React.PropTypes.arrayOf(React.PropTypes.renderable),
        selectedItem: React.PropTypes.renderable,
        onItemSelect: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            items: []
        };
    },

    render: function() {
        var that = this;
        
        var listItems = this.props.items.map(function(item) {
            
            var segments = ['Injury', 'Property', 'PIP/MPC'];
            var itemIsSegment = segments.indexOf(item) > -1;
            
            /*jshint ignore:start */
            if(item === that.props.selectedItem) {
                return React.DOM.li({className: "listchooser-item-selected", key: item}, 
                            itemIsSegment ? React.DOM.strong(null, item) : React.DOM.span(null, item)
                       );
            } else {
                return React.DOM.li({className: "listchooser-item", key: item, onClick: that.selectItem.bind(that, item)}, 
                            itemIsSegment ? React.DOM.strong(null, item) : React.DOM.span(null, item)
                       );
            }
            /*jshint ignore:end */
        });
        return (
            /*jshint ignore:start */
            React.DOM.div({id: this.props.id}, 
                React.DOM.p({className: "section-title"}, this.props.title), 
                React.DOM.ul({className: "listchooser-list"}, listItems)
            )
            /*jshint ignore:end */
        );
    },

    selectItem: function(item) {
        this.props.onItemSelect(item);
        return false;
    }
});

},{}],11:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

module.exports = React.createClass({displayName: 'TimeSlider',

    propTypes: {
        id: React.PropTypes.string,
        numMonths: React.PropTypes.number,
        firstMonth: React.PropTypes.number,
        rangeStart: React.PropTypes.number,
        rangeSize: React.PropTypes.number,
        onRangeChange: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            numMonths: -1,
            firstMonth: -1,
            rangeStart: -1,
            rangeSize: 1
        };
    },

    render: function() {
        var rangeTxt = 'Date Range';
        if(this.props.rangeStart > 0) {
            var startYr = 1970 + Math.floor(this.props.rangeStart / 12);
            var rangeEnd = this.props.rangeStart + this.props.rangeSize - 1;
            var endYr = 1970 + Math.floor(rangeEnd / 12);
            rangeTxt = months[this.props.rangeStart % 12] + ' ' + startYr;
        }

        /*jshint ignore:start */

        var yrSections = [];
        var thumb = null;
        if(this.props.numMonths && this.props.firstMonth) {
            var sectionWidthPercent = 100 * 12 / this.props.numMonths;
            for(var mo = this.props.firstMonth; mo < this.props.firstMonth + this.props.numMonths; mo++) {
                if(mo % 12 === 0) { // January
                    var offsetPercent = 100 * (mo - this.props.firstMonth) / this.props.numMonths;
                    var sectionStyle = { left: offsetPercent + '%', width: sectionWidthPercent + '%' };
                    var barStyle = {}
                    if(mo === this.props.firstMonth) barStyle['border-left'] = 'none';

                    yrSections.push(React.DOM.div({className: "tslider-section", key: mo, style: sectionStyle}, 
                        React.DOM.div({className: "tslider-sectionbar", style: barStyle}), 
                        React.DOM.p({className: "tslider-sectiontxt"}, 1970 + Math.floor(mo / 12))
                    ));
                } else if(mo % 3 === 0) { // April, July, October
                    var offsetPercent = 100 * (mo - this.props.firstMonth) / this.props.numMonths;
                    var sectionStyle = { left: offsetPercent + '%', width: sectionWidthPercent + '%' };
                    var barStyle = {}
                    if(mo === this.props.firstMonth) barStyle['border-left'] = 'none';

                    yrSections.push(React.DOM.div({className: "tslider-section", key: mo, style: sectionStyle}, 
                        React.DOM.div({className: "tslider-sectionbar-minor", style: barStyle})
                    ));
                }                  
            }

            var thumbOffset = 100 * (this.props.rangeStart - this.props.firstMonth) / this.props.numMonths;
            thumbOffset = Math.max(0, Math.min(100, thumbOffset));
            var thumbWidth = 100 * this.props.rangeSize / this.props.numMonths;
            thumbWidth = Math.max(0, Math.min(100 - thumbOffset, thumbWidth));
            var thumbStyle = { left: thumbOffset + '%', width: 'calc(' + thumbWidth + '% + 1px)' };
            thumb = React.DOM.div({className: "tslider-thumb", ref: "thumb", style: thumbStyle, onMouseDown: this.onMouseDown})
        }
        /*jshint ignore:end */

        return (
            /*jshint ignore:start */
            React.DOM.div({id: this.props.id}, 
                React.DOM.div({className: "tslider-titlebar"}, 
                    React.DOM.p({className: "section-title tslider-title"}, rangeTxt)
                ), 
                React.DOM.div({className: "tslider-content", ref: "track", onMouseUp: this.onMouseUp, onMouseMove: this.onMouseMove, onMouseLeave: this.onMouseLeave}, 
                    yrSections, 
                    thumb
                )
            )
            /*jshint ignore:end */
        );
    },

    getInitialState: function() {
        return {
            dragging: false,
            delta: 0,
            offsetPercent: 0
        };
    },

    selectRangeSz: function(value) {
        this.props.onRangeChange(this.props.rangeStart, value);
        return false;
    },

    onMouseDown: function(e) {
        if(e.button !== 0) return; // left button
        var thumbOffset = this.refs.thumb.getDOMNode().getBoundingClientRect().left;
        this.setState({
            dragging: true,
            delta: e.nativeEvent.pageX - thumbOffset
        });
        return false;
    },
    onMouseMove: function(e) {
        if(!this.state.dragging) return;
        var trackOffset = this.refs.track.getDOMNode().getBoundingClientRect().left;
        var trackWidth = this.refs.track.getDOMNode().clientWidth;
        var offset = e.nativeEvent.pageX - this.state.delta - trackOffset;
        var offsetPercent = 100 * offset / trackWidth;
        var nearestMonth = this.props.firstMonth + Math.round(offsetPercent * this.props.numMonths / 100);
        nearestMonth = Math.max(this.props.firstMonth, Math.min(this.props.firstMonth + this.props.numMonths - 1, nearestMonth));
        if(nearestMonth != this.props.rangeStart) this.props.onRangeChange(nearestMonth, this.props.rangeSize);
        return false;
    },
    onMouseUp: function(e) {
        if(this.state.dragging) {
            this.setState({
                dragging: false
            });
        } else {
            var trackOffset = this.refs.track.getDOMNode().getBoundingClientRect().left;
            var trackWidth = this.refs.track.getDOMNode().clientWidth;
            var offset = e.nativeEvent.pageX - trackOffset;
            var offsetPercent = 100 * offset / trackWidth;
            var nearestMonth = this.props.firstMonth + Math.round(offsetPercent * this.props.numMonths / 100);
            nearestMonth = Math.max(this.props.firstMonth, Math.min(this.props.firstMonth + this.props.numMonths - 1, nearestMonth));
            if(nearestMonth != this.props.rangeStart) this.props.onRangeChange(nearestMonth, this.props.rangeSize);
        }
        return false;
    },
    onMouseLeave: function(e) {
        this.setState({
            dragging: false
        });
        return false;
    }
});

},{}],12:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */

module.exports = React.createClass({displayName: 'ToggleChooser',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable,
        items: React.PropTypes.arrayOf(React.PropTypes.renderable),
        selectedItem: React.PropTypes.renderable,
        onItemSelect: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            items: []
        };
    },

    render: function() {
        var that = this;
        var itemStyle = {
            width: (100 / this.props.items.length) + '%'
        };
        var listItems = this.props.items.map(function(item) {
            /*jshint ignore:start */
            if(item === that.props.selectedItem) {
                return React.DOM.li({className: "togglechooser-item-selected", key: item, style: itemStyle}, item);
            } else {
                return React.DOM.li({className: "togglechooser-item", key: item, style: itemStyle, onClick: that.selectItem.bind(that, item)}, item);
            }
            /*jshint ignore:end */
        });
        return (
            /*jshint ignore:start */
            React.DOM.div({id: this.props.id}, 
                React.DOM.p({className: "section-title"}, this.props.title), 
                React.DOM.ul({className: "togglechooser-list"}, listItems)
            )
            /*jshint ignore:end */
        );
    },

    selectItem: function(item) {
        this.props.onItemSelect(item);
        return false;
    }
});

},{}],13:[function(require,module,exports){
"use strict";
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

},{}],14:[function(require,module,exports){
"use strict";
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
},{}],15:[function(require,module,exports){
"use strict";
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

},{}],16:[function(require,module,exports){
"use strict";
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
},{"./emitter":14}],17:[function(require,module,exports){
"use strict";
module.exports = {
    debounce: function(func, wait, immediate) {
        var timeout, args, context, timestamp, result;
        return function() {
            context = this;
            args = arguments;
            timestamp = new Date();
            var later = function() {
                var last = (new Date()) - timestamp;
                if (last < wait) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    if (!immediate) result = func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            if (callNow) result = func.apply(context, args);
            return result;
        };
    }
};

},{}],18:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var coverage = null;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getCoverage: function() {
        return coverage;
    },
    setCoverage: function(value) {
        coverage = value;
        emitter.emit();
    }
};

},{"../core/emitter":14}],19:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var rangeStart = -1;
var rangeSize = 1;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getRangeStart: function() {
        return rangeStart;
    },
    getRangeSize: function() {
        return rangeSize;
    },
    setRange: function(startValue, sizeValue) {
        rangeStart = startValue;
        rangeSize = sizeValue;
        emitter.emit();
    },
    setRangeStart: function(value) {
        rangeStart = value;
        emitter.emit();
    },
    setRangeSize: function(value) {
        rangeSize = value;
        emitter.emit();
    }
};

},{"../core/emitter":14}],20:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var data = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  hasData: function() {
    return data !== null;
  },
  getData: function() {
    return data;
  },
  setData: function(value) {
    data = value;
    emitter.emit();
  }
};

},{"../core/emitter":14}],21:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var forecast = 'Off';

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getForecast: function() {
    return forecast;
  },
  setForecast: function(value) {
    forecast = value;
    emitter.emit();
  }
};

},{"../core/emitter":14}],22:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var horizon = null;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getHorizon: function() {
        return horizon;
    },
    setHorizon: function(value) {
        horizon = value;
        emitter.emit();
    }
};

},{"../core/emitter":14}],23:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var metric = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getMetric: function() {
    return metric;
  },
  setMetric: function(value) {
    metric = value;
    emitter.emit();
  }
};

},{"../core/emitter":14}],24:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var odata = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  hasData: function() {
    return odata !== null;
  },
  getData: function() {
    return odata;
  },
  setData: function(value) {
    odata = value;
    emitter.emit();
  }
};

},{"../core/emitter":14}],25:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var period = null;

module.exports = {
    onChange: function(callback) {
        emitter.register(callback);
    },
    offChange: function(callback) {
        emitter.unregister(callback);
    },
    getPeriod: function() {
        return period;
    },
    setPeriod: function(value) {
        period = value;
        emitter.emit();
    }
};

},{"../core/emitter":14}],26:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var showSelectedChart = 'Off';

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getShowSelectedChart: function() {
    return showSelectedChart;
  },
  setShowSelectedChart: function(value) {
    showSelectedChart = value;
    emitter.emit();
  }
};
},{"../core/emitter":14}],27:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var state = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  isStateSelected: function() {
    return state !== null;
  },
  getState: function() {
    return state;
  },
  setState: function(value) {
    state = value;
    emitter.emit();
  }
};

},{"../core/emitter":14}],28:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var stateView = 'Charts';

module.exports = {
  ViewState: Object.freeze({
    CHARTS: 'Charts',
    TABLE: 'Table'
  }),
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getStateView: function() {
    return stateView;
  },
  setStateView: function(value) {
    stateView = value;
    emitter.emit();
  }
};

},{"../core/emitter":14}],29:[function(require,module,exports){
"use strict";
module.exports = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District of Columbia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
    'ALABAMA': 'Alabama',
    'ALASKA': 'Alaska',
    'ARIZONA': 'Arizona',
    'ARKANSAS': 'Arkansas',
    'CALIFORNIA': 'California',
    'COLORADO': 'Colorado',
    'CONNECTICUT': 'Connecticut',
    'DELAWARE': 'Delaware',
    'DIST OF COL': 'District of Columbia',
    'FLORIDA': 'Florida',
    'GEORGIA': 'Georgia',
    'HAWAII': 'Hawaii',
    'IDAHO': 'Idaho',
    'ILLINOIS': 'Illinois',
    'INDIANA': 'Indiana',
    'IOWA': 'Iowa',
    'KANSAS': 'Kansas',
    'KENTUCKY': 'Kentucky',
    'LOUISIANA': 'Louisiana',
    'MAINE': 'Maine',
    'MARYLAND': 'Maryland',
    'MASSACHUSETTS': 'Massachusetts',
    'MICHIGAN': 'Michigan',
    'MINNESOTA': 'Minnesota',
    'MISSISSIPPI': 'Mississippi',
    'MISSOURI': 'Missouri',
    'MONTANA': 'Montana',
    'NEBRASKA': 'Nebraska',
    'NEVADA': 'Nevada',
    'NEW HAMPSHIRE': 'New Hampshire',
    'NEW JERSEY': 'New Jersey',
    'NEW MEXICO': 'New Mexico',
    'NEW YORK': 'New York',
    'NORTH CAROLINA': 'North Carolina',
    'NORTH DAKOTA': 'North Dakota',
    'OHIO': 'Ohio',
    'OKLAHOMA': 'Oklahoma',
    'OREGON': 'Oregon',
    'PENNSYLVANIA': 'Pennsylvania',
    'RHODE ISLAND': 'Rhode Island',
    'SOUTH CAROLINA': 'South Carolina',
    'SOUTH DAKOTA': 'South Dakota',
    'TENNESSEE': 'Tennessee',
    'TEXAS': 'Texas',
    'UTAH': 'Utah',
    'VERMONT': 'Vermont',
    'VIRGINIA': 'Virginia',
    'WASHINGTON': 'Washington',
    'WEST VIRGINIA': 'West Virginia',
    'WISCONSIN': 'Wisconsin',
    'WYOMING': 'Wyoming'
};
},{}],30:[function(require,module,exports){
"use strict";
var Emitter = require('../core/emitter');

var emitter = new Emitter();
var err = null;

module.exports = {
  onChange: function(callback) {
      emitter.register(callback);
  },
  offChange: function(callback) {
      emitter.unregister(callback);
  },
  getError: function() {
    return err;
  },
  setError: function(value) {
    err = value;
    emitter.emit();
  }
};

},{"../core/emitter":14}],31:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */
var OverviewDataMdl = require('../model/overviewDataMdl');
var DetailDataMdl = require('../model/detailDataMdl');
var PeriodMdl = require('../model/periodMdl');
var TrendChart = require('./trendChart');

module.exports = React.createClass({displayName: 'ChartsArea',
    propTypes: {
        coverage: React.PropTypes.string
    },

    render: function() {
        if(this.state.detailData === null) return null;
        var stateData = this.state.detailData;
        var charts = [];
        for(var metricName in stateData.metrics) {
            var startDate = (stateData.startYear - 1970) * 12 + stateData.startMonth;
            //if (PeriodMdl.getPeriod() == 'R12') startDate += 11;
            /*jshint ignore:start */
            charts.push(TrendChart({id: 'tchart-' + charts.length, key: metricName + this.props.coverage, 
                title: metricName, startDate: startDate, data: stateData.metrics[metricName][this.props.coverage]}));
            /*jshint ignore:end */
        }
        return (
            /*jshint ignore:start */
            React.DOM.div({id: "detail-charts"}, charts)
            /*jshint ignore:end */
        );
    },

    getInitialState: function() {
        return {
            metrics: OverviewDataMdl.getData() ? OverviewDataMdl.getData().metricsNames : [],
            detailData: DetailDataMdl.getData()
        };
    },
    componentDidMount: function() {
        OverviewDataMdl.onChange(this.onDataChange);
        DetailDataMdl.onChange(this.onDtlDataChange);
    },
    componentWillUnmount: function() {
        OverviewDataMdl.offChange(this.onDataChange);
        DetailDataMdl.offChange(this.onDtlDataChange);
    },
    onDtlDataChange: function() {
        this.setState({
            detailData: DetailDataMdl.getData()
        });
    },
    onDataChange: function() {
        var data = OverviewDataMdl.getData();
        this.setState({
            metrics: data.metricsNames
        });
    }
});

},{"../model/detailDataMdl":20,"../model/overviewDataMdl":24,"../model/periodMdl":25,"./trendChart":36}],32:[function(require,module,exports){
"use strict";
module.exports = {
    scale: d3.scale.linear()
        .domain([-2, -1, -0.99, 0.99, 1, 2])
        .range(['#8ea8be', '#d8e1e8', '#ffffff', '#ffffff', '#ffeebd', '#ffdc73'])
        .clamp(true)
};


},{}],33:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */
var AppHeader = require('../component/appHeader');
var TimeSlider = require('../component/timeSlider');
var ListChooser = require('../component/listChooser');
var ToggleChooser = require('../component/toggleChooser');
var DropdownChooser = require('../component/dropdownChooser');
var Legend = require('../component/legend');
var ChartsArea = require('./chartsArea');
var TableArea = require('./tableArea');
var StateMdl = require('../model/stateMdl');
var StateViewMdl = require('../model/stateViewMdl');
var CoverageMdl = require('../model/coverageMdl');
var OverviewDataMdl = require('../model/overviewDataMdl');
var HorizonMdl = require('../model/horizonMdl');
var PeriodMdl = require('../model/periodMdl');
var ForecastMdl = require('../model/forecastMdl');
var ShowSelectedChartMdl = require('../model/showSelectedChartMdl');
var DataColors = require('./dataColors');
var States = require('../model/states');
var SelectStateAction = require('../action/selectStateAction');

module.exports = React.createClass({displayName: 'OverviewPg',

    render: function() {
        var showForecast = ForecastMdl.getForecast()=='On' && HorizonMdl.getHorizon()==1;
        console.log(showForecast);
        var chartCats = (showForecast) ? this.chartCatsForecast : this.chartCats;
        
        var horizonToNewTrendsDetectedLabel = {
            '1': 'Short-term trends (1 month)',
            '6': 'Medium-term trends (6 months)',
            '12': 'Long-term trends (1 year)'
        };
        
        var newTrendsDetectedLabel = '';
        var newTrendsDetectedLabels = [];
        if (this.state.selectedHorizon) {
            newTrendsDetectedLabel = horizonToNewTrendsDetectedLabel[this.state.selectedHorizon];
            newTrendsDetectedLabels = Object.keys(horizonToNewTrendsDetectedLabel)
                                            .map(function(key){return horizonToNewTrendsDetectedLabel[key]});
        }
        
        return (
            /*jshint ignore:start */
            React.DOM.div(null, 
                AppHeader({title: "Claims Early Notification Tool"}), 
                React.DOM.div({id: "dtl-content"}, 
                    React.DOM.p({id: "dtl-title", className: "page-title"}, 
                        React.DOM.a({href: "#", id: "dtl-back", className: "fa fa-chevron-left", onClick: this.navBack}), 
                        States[this.state.selectedState], " Details"
                    ), 
                    React.DOM.div({id: "dtl-main-area"}, 
                         (this.state.selectedStateView === StateViewMdl.ViewState.CHARTS) ? ChartsArea({coverage: this.state.selectedCvg}) : TableArea({coverage: this.state.selectedCvg})
                    ), 
                    React.DOM.div({id: "dtl-filter-area"}, 
                        ToggleChooser({id: "dtl-view-toggle", title: "View", items: [ 'Charts', 'Table'], selectedItem: this.state.selectedStateView, onItemSelect: this.onStateViewSelect}), 
                         DropdownChooser({id: "dtl-horizon-filter", title: "New Trends Detected", items: newTrendsDetectedLabels, selectedItem: newTrendsDetectedLabel, onItemSelect: this.onHorizonSelect}), 
                         (this.state.selectedHorizon == 1) ? ToggleChooser({id: "dtl-forecast-filter", title: "Forecast", items: ['On', 'Off'], selectedItem: this.state.selectedForecast, onItemSelect: this.onForecastSelect}) : React.DOM.span(null), 
                        ToggleChooser({id: "dtl-period-filter", title: "Rolling 12 or Monthly", items: this.state.periods, selectedItem: this.state.selectedPeriod, onItemSelect: this.onPeriodSelect}), 
                        ListChooser({id: "dtl-cvg-filter", title: "Coverage / Segment", items: this.state.cvgs, selectedItem: this.state.selectedCvg, onItemSelect: this.onCvgSelect}), 
                         (this.state.selectedStateView === StateViewMdl.ViewState.CHARTS) ? Legend({categories: chartCats}) : Legend({categories: this.tableCats})
                    )
                )
            )
            /*jshint ignore:end */
        );
    },
    getInitialState: function() {
        return {
            cvgs: OverviewDataMdl.getData() ? OverviewDataMdl.getData().coverages : [],
            selectedCvg: CoverageMdl.getCoverage(),
            selectedState: StateMdl.getState(),
            selectedStateView: StateViewMdl.getStateView(),
            horizons: OverviewDataMdl.getData() ? OverviewDataMdl.getData().horizons : [],
            selectedHorizon: HorizonMdl.getHorizon(),
            periods: OverviewDataMdl.getData() ? OverviewDataMdl.getData().periods : [],
            selectedPeriod: PeriodMdl.getPeriod(),
            selectedForecast: ForecastMdl.getForecast()
        };
    },
    componentWillMount: function() {
        this.chartCats = [];
        this.chartCats.push({
            name: 'Actual Values',
            color: '#444444',
            borderColor: '#000000'
        });
        this.chartCats.push({
            name: 'Expected Range',
            color: 'rgba(168,255,155,0.5)',
            borderColor: 'rgba(168,255,155,1)'
        });
        
        this.chartCatsForecast = [];
        this.chartCatsForecast.push({
            name: 'Actual Values',
            color: '#444444',
            borderColor: '#000000'
        });
        this.chartCatsForecast.push({
            name: 'Expected Range',
            color: 'rgba(168,255,155,0.5)',
            borderColor: 'rgba(168,255,155,1)'
        });
        this.chartCatsForecast.push({
            name: 'Forecasted Range',
            color: 'rgba(211,211,211,0.5)',
            border: 'rgba(211,211,211,1)' 
        });

        this.tableCats = [];
        this.tableCats.push({
            name: 'High Values',
            color: DataColors.scale(1.5),
            borderColor: DataColors.scale(2)
        });
        this.tableCats.push({
            name: 'Expected Values',
            color: '#ffffff',
            borderColor: '#999999'
        });
        this.tableCats.push({
            name: 'Low Values',
            color: DataColors.scale(-1.5),
            borderColor: DataColors.scale(-2)
        });
    },
    componentDidMount: function() {
        this.originalCvg = this.state.selectedCvg;
        StateMdl.onChange(this.onSelectedStateChange);
        StateViewMdl.onChange(this.onStateViewChange);
        CoverageMdl.onChange(this.onCvgChange);
        OverviewDataMdl.onChange(this.onDataChange);
        HorizonMdl.onChange(this.onHorizonChange);
        PeriodMdl.onChange(this.onPeriodChange);
        ForecastMdl.onChange(this.onForecastChange);
    },
    componentWillUnmount: function() {
        StateMdl.offChange(this.onSelectedStateChange);
        StateViewMdl.offChange(this.onStateViewChange);
        CoverageMdl.offChange(this.onCvgChange);
        OverviewDataMdl.offChange(this.onDataChange);
        HorizonMdl.offChange(this.onHorizonChange);
        PeriodMdl.offChange(this.onPeriodChange);
        ForecastMdl.offChange(this.onForecastChange);
    },
    onSelectedStateChange: function() {
        this.setState({
            selectedState: StateMdl.getState()
        });
    },
    onStateViewChange: function() {
        this.setState({
            selectedStateView: StateViewMdl.getStateView()
        });
    },
    onDataChange: function() {
        var data = OverviewDataMdl.getData();
        this.setState({
            cvgs: data.coverages,
            horizons: data.horizons,
            periods: data.periods
        });
    },
    onCvgChange: function() {
        this.setState({
            selectedCvg: CoverageMdl.getCoverage()
        });
    },
    onHorizonChange: function() {
        this.setState({
            selectedHorizon: HorizonMdl.getHorizon()
        });
    },
    onPeriodChange: function() {
        this.setState({
            selectedPeriod: PeriodMdl.getPeriod()
        });
    },
    onForecastChange: function() {
        this.setState({
            selectedForecast: ForecastMdl.getForecast()
        });
    },
    onCvgSelect: function(cvg) {
        ShowSelectedChartMdl.setShowSelectedChart('Off');
        CoverageMdl.setCoverage(cvg);
    },
    onStateViewSelect: function(view) {
        StateViewMdl.setStateView(view);
    },
    onHorizonSelect: function(newTrendsDetectedLabel) {
        ShowSelectedChartMdl.setShowSelectedChart('Off');
        var horizon = 1;
        if (newTrendsDetectedLabel == 'Short-term trends (1 month)') horizon = 1;
        if (newTrendsDetectedLabel == 'Medium-term trends (6 months)') horizon = 6;
        if (newTrendsDetectedLabel == 'Long-term trends (1 year)') horizon = 12;
        HorizonMdl.setHorizon(horizon);
        var selectedState = StateMdl.getState();
        var period = PeriodMdl.getPeriod();
        SelectStateAction.exec(horizon, period, selectedState);
        return false;
    },
    onPeriodSelect: function(period) {
        ShowSelectedChartMdl.setShowSelectedChart('Off');
        PeriodMdl.setPeriod(period);
        var selectedState = StateMdl.getState();
        var horizon = HorizonMdl.getHorizon();
        SelectStateAction.exec(horizon, period, selectedState);
        return false;
    },
    onForecastSelect: function(forecast) {
        ForecastMdl.setForecast(forecast);
    },
    navBack: function(el) {
        if(this.originalCvg) CoverageMdl.setCoverage(this.originalCvg);
        StateMdl.setState(null);
        return false;
    }
});

},{"../action/selectStateAction":4,"../component/appHeader":7,"../component/dropdownChooser":8,"../component/legend":9,"../component/listChooser":10,"../component/timeSlider":11,"../component/toggleChooser":12,"../model/coverageMdl":18,"../model/forecastMdl":21,"../model/horizonMdl":22,"../model/overviewDataMdl":24,"../model/periodMdl":25,"../model/showSelectedChartMdl":26,"../model/stateMdl":27,"../model/stateViewMdl":28,"../model/states":29,"./chartsArea":31,"./dataColors":32,"./tableArea":35}],34:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */
var InitDataAction = require('../action/initDataAction');
var SelectStateAction = require('../action/selectStateAction');
var AppHeader = require('../component/appHeader');
var TimeSlider = require('../component/timeSlider');
var DropdownChooser = require('../component/dropdownChooser');
var ListChooser = require('../component/listChooser');
var ToggleChooser = require('../component/toggleChooser');
var Legend = require('../component/legend');
var UsMap = require('./usMap');
var DataColors = require('./dataColors');
var OverviewDataMdl = require('../model/overviewDataMdl');
var MetricMdl = require('../model/metricMdl');
var CoverageMdl = require('../model/coverageMdl');
var DateRangeMdl = require('../model/dateRangeMdl');
var HorizonMdl = require('../model/horizonMdl');
var PeriodMdl = require('../model/periodMdl');
var ShowSelectedChartMdl = require('../model/showSelectedChartMdl');

module.exports = React.createClass({displayName: 'OverviewPg',

    render: function() {    
        var legendCats = [];
        legendCats.push({
            name: 'Above range',
            color: DataColors.scale(2),
            borderColor: d3.rgb(DataColors.scale(2)).darker().toString()
        });
        legendCats.push({
            name: '',
            color: DataColors.scale(1),
            borderColor: d3.rgb(DataColors.scale(1)).darker().toString()
        });
        legendCats.push({
            name: 'Within range',
            color: '#ffffff',
            borderColor: '#999999'
        });
        legendCats.push({
            name: ' ',
            color: DataColors.scale(-1),
            borderColor: d3.rgb(DataColors.scale(-1)).darker().toString()
        });
        legendCats.push({
            name: 'Below range',
            color: DataColors.scale(-2),
            borderColor: d3.rgb(DataColors.scale(-2)).darker().toString()
        });
               
        var horizonToNewTrendsDetectedLabel = {
            '1': 'Short-term trends (1 month)',
            '6': 'Medium-term trends (6 months)',
            '12': 'Long-term trends (1 year)'
        };
        
        var newTrendsDetectedLabel = '';
        var newTrendsDetectedLabels = [];
        if (this.state.selectedHorizon) {
            newTrendsDetectedLabel = horizonToNewTrendsDetectedLabel[this.state.selectedHorizon];
            newTrendsDetectedLabels = Object.keys(horizonToNewTrendsDetectedLabel)
                                            .map(function(key){return horizonToNewTrendsDetectedLabel[key]});
        }
            
        return (
            /*jshint ignore:start */
            React.DOM.div(null, 
                AppHeader({title: "Claims Early Notification Tool"}), 
                React.DOM.div({id: "oview-content"}, 
                    React.DOM.p({id: "oview-title", className: "page-title"}, "Explore"), 
                    React.DOM.div({id: "oview-map-area"}, 
                        TimeSlider({id: "oview-time-filter", numMonths: this.state.numMonths, firstMonth: this.state.firstMonth, rangeStart: this.state.rangeStart, rangeSize: this.state.rangeSize, onRangeChange: this.onRangeChange}), 
                        UsMap(null), 
                        React.DOM.p({id: "oview-map-note", className: "note-txt"}, "Click any state for detailed charts")
                    ), 
                    React.DOM.div({id: "oview-filter-area"}, 
                        DropdownChooser({id: "oview-horizon-filter", title: "New Trends Detected", items: newTrendsDetectedLabels, selectedItem: newTrendsDetectedLabel, onItemSelect: this.onHorizonSelect}), 
                        ToggleChooser({id: "oview-period-filter", title: "Rolling 12 or Monthly", items: this.state.periods, selectedItem: this.state.selectedPeriod, onItemSelect: this.onPeriodSelect}), 
                        ListChooser({id: "oview-cvg-filter", title: "Coverage / Segment", items: this.state.cvgs, selectedItem: this.state.selectedCvg, onItemSelect: this.onCvgSelect}), 
                        ListChooser({id: "oview-metrics-filter", title: "Metrics", items: this.state.metrics, selectedItem: this.state.selectedMetric, onItemSelect: this.onMetricSelect}), 
                        Legend({categories: legendCats, hasMargins: false})
                    ), 
                    React.DOM.p({id: "oview-title-2", className: "page-title"}, "Highlights"), 
                    React.DOM.p({id: "oview-title-smaller", className: "page-title-smaller"}, "Injury"), 
                    React.DOM.div({id: "oview-table-col1"}, 
                        React.DOM.p({id: "oview-section-title", className: "section-title"}, "Top above range"), 
                        React.DOM.table({id: "oview-table"}, 
                            React.DOM.tbody(null, this.getTableRows('Injury', 'top'))
                        )
                    ), 
                    React.DOM.div({id: "oview-table-col2"}, 
                        React.DOM.p({id: "oview-section-title", className: "section-title"}, "Top below range"), 
                        React.DOM.table({id: "oview-table"}, 
                            React.DOM.tbody(null, this.getTableRows('Injury', 'bottom'))
                        )
                    ), 
                    React.DOM.p({id: "oview-title-smaller", className: "page-title-smaller"}, "PIP/MPC"), 
                    React.DOM.div({id: "oview-table-col1"}, 
                        React.DOM.p({id: "oview-section-title", className: "section-title"}, "Top above range"), 
                        React.DOM.table({id: "oview-table"}, 
                            React.DOM.tbody(null, this.getTableRows('PIP/MPC', 'top'))
                        )
                    ), 
                    React.DOM.div({id: "oview-table-col2"}, 
                        React.DOM.p({id: "oview-section-title", className: "section-title"}, "Top below range"), 
                        React.DOM.table({id: "oview-table"}, 
                            React.DOM.tbody(null, this.getTableRows('PIP/MPC', 'bottom'))
                        )
                    ), 
                    React.DOM.p({id: "oview-title-smaller", className: "page-title-smaller"}, "Property"), 
                    React.DOM.div({id: "oview-table-col1"}, 
                        React.DOM.p({id: "oview-section-title", className: "section-title"}, "Top above range"), 
                        React.DOM.table({id: "oview-table"}, 
                            React.DOM.tbody(null, this.getTableRows('Property', 'top'))
                        )
                    ), 
                    React.DOM.div({id: "oview-table-col2"}, 
                        React.DOM.p({id: "oview-section-title", className: "section-title"}, "Top below range"), 
                        React.DOM.table({id: "oview-table"}, 
                            React.DOM.tbody(null, this.getTableRows('Property', 'bottom'))
                        )
                    )
                )
            )
            /*jshint ignore:end */
        );
    },

    getInitialState: function() {
        return {
            metrics: OverviewDataMdl.getData() ? OverviewDataMdl.getData().metricsNames : [],
            selectedMetric: MetricMdl.getMetric(),
            cvgs: OverviewDataMdl.getData() ? OverviewDataMdl.getData().coverages : [],
            selectedCvg: CoverageMdl.getCoverage(),
            numMonths: OverviewDataMdl.getData() ? OverviewDataMdl.getData().numMonths : -1,
            firstMonth: OverviewDataMdl.getData() ? OverviewDataMdl.getData().startDate : -1,
            rangeStart: DateRangeMdl.getRangeStart(),
            rangeSize: DateRangeMdl.getRangeSize(),
            table: OverviewDataMdl.getData() ? OverviewDataMdl.getData().table : [],
            horizons: OverviewDataMdl.getData() ? OverviewDataMdl.getData().horizons : [],
            selectedHorizon: HorizonMdl.getHorizon(),
            periods: OverviewDataMdl.getData() ? OverviewDataMdl.getData().periods : [],
            selectedPeriod: PeriodMdl.getPeriod()
        };
    },

    componentDidMount: function() {
        MetricMdl.onChange(this.onMetricChange);
        CoverageMdl.onChange(this.onCvgChange);
        OverviewDataMdl.onChange(this.onDataChange);
        DateRangeMdl.onChange(this.onDateChange);
        HorizonMdl.onChange(this.onHorizonChange);
        PeriodMdl.onChange(this.onPeriodChange);
    },
    componentWillUnmount: function() {
        MetricMdl.offChange(this.onMetricChange);
        CoverageMdl.offChange(this.onCvgChange);
        OverviewDataMdl.offChange(this.onDataChange);
        DateRangeMdl.offChange(this.onDateChange);
        HorizonMdl.offChange(this.onHorizonChange);
        PeriodMdl.offChange(this.onPeriodChange);
    },

    onRangeChange: function(start, size) {
        DateRangeMdl.setRange(start, size);
    },

    onMetricChange: function() {
        this.setState({
            selectedMetric: MetricMdl.getMetric()
        });
    },

    onCvgChange: function() {
        this.setState({
            selectedCvg: CoverageMdl.getCoverage()
        });
    },
                                    
    onHorizonChange: function() {
        this.setState({
            selectedHorizon: HorizonMdl.getHorizon()
        });
    },
                                    
    onPeriodChange: function() {
        this.setState({
            selectedPeriod: PeriodMdl.getPeriod()
        });
    },

    onDateChange: function() {
        this.setState({
            rangeStart: DateRangeMdl.getRangeStart(),
            rangeSize: DateRangeMdl.getRangeSize()
        });
    },

    onDataChange: function() {
        var data = OverviewDataMdl.getData();
        this.setState({
            metrics: data.metricsNames,
            cvgs: data.coverages,
            numMonths: data.numMonths,
            firstMonth: data.startDate,
            table: data.table,
            horizons: data.horizons,
            periods: data.periods
        });
    },

    onMetricSelect: function(metric) {
        MetricMdl.setMetric(metric);
    },

    onCvgSelect: function(cvg) {
        CoverageMdl.setCoverage(cvg);
    },
                                    
    onHorizonSelect: function(newTrendsDetectedLabel) {
        var horizon = 1;
        if (newTrendsDetectedLabel == 'Short-term trends (1 month)') horizon = 1;
        if (newTrendsDetectedLabel == 'Medium-term trends (6 months)') horizon = 6;
        if (newTrendsDetectedLabel == 'Long-term trends (1 year)') horizon = 12;
        HorizonMdl.setHorizon(horizon);
        var period = PeriodMdl.getPeriod();
        InitDataAction.exec(horizon, period);
    },
                                    
    onPeriodSelect: function(period) {
        PeriodMdl.setPeriod(period);
        var horizon = HorizonMdl.getHorizon();
        InitDataAction.exec(horizon, period);
    },
        
    selectRow: function(rowData) {
        var data = OverviewDataMdl.getData();
        CoverageMdl.setCoverage(rowData.cvg);
        MetricMdl.setMetric(rowData.metric);
        DateRangeMdl.setRangeStart(data.startDate + data.numMonths - DateRangeMdl.getRangeSize());
        ShowSelectedChartMdl.setShowSelectedChart('On');
        var horizon = HorizonMdl.getHorizon();
        var period = PeriodMdl.getPeriod();
        SelectStateAction.exec(horizon, period, rowData.state);
    },
                                    
    getTableRows: function(segment, topOrBottom) {
        // Segment: 'Injury', 'PIP/MPC', or 'Property'
        // topOrBottom: 'top' or 'bottom'

        if (topOrBottom=='top') var backgroundColor = DataColors.scale(2);
        if (topOrBottom=='bottom') var backgroundColor = DataColors.scale(-2);
        
        var colorStyle = {
            backgroundColor: backgroundColor,
            width: '12px'
        };
        
        var cellPadding = {
            padding: '0 4px'
        };
        
        var stateStyle = {
            padding: '0 4px',
            textTransform: 'capitalize',
        }; 
        
        var tableData = [];
        if (Object.keys(this.state.table).length > 0) {
            tableData = this.state.table[segment][topOrBottom];
            if (topOrBottom=='top') tableData = tableData.sort(function(a,b) { return parseFloat(b[3]) - parseFloat(a[3]) });
            if (topOrBottom=='bottom') tableData = tableData.sort(function(a,b) { return parseFloat(a[3]) - parseFloat(b[3]) });
        } 
            
        var tableRows = [];
        for (var i=0; i<tableData.length; i++) {
             var rowData = {
                metric: tableData[i][0],
                cvg: tableData[i][1],
                state: tableData[i][2],                    
                score: tableData[i][3]
            };           
            
            tableRows.push(
                /*jshint ignore:start */
                React.DOM.tr({onClick: this.selectRow.bind(this, rowData)}, 
                  React.DOM.td({style: colorStyle}, " "), 
                  React.DOM.td({style: stateStyle}, rowData.state.toLowerCase()), 
                  React.DOM.td({style: cellPadding}, rowData.cvg), 
                  React.DOM.td({style: cellPadding}, rowData.metric)
                )

                /*jshint ignore:end */
            );
        }
                                    
        return tableRows;
    }
});

},{"../action/initDataAction":2,"../action/selectStateAction":4,"../component/appHeader":7,"../component/dropdownChooser":8,"../component/legend":9,"../component/listChooser":10,"../component/timeSlider":11,"../component/toggleChooser":12,"../model/coverageMdl":18,"../model/dateRangeMdl":19,"../model/horizonMdl":22,"../model/metricMdl":23,"../model/overviewDataMdl":24,"../model/periodMdl":25,"../model/showSelectedChartMdl":26,"./dataColors":32,"./usMap":37}],35:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */
var OverviewDataMdl = require('../model/overviewDataMdl');
var DetailDataMdl = require('../model/detailDataMdl');
var Formatting = require('../core/formatting');
var StateMdl = require('../model/stateMdl');
var CoverageMdl = require('../model/coverageMdl');
var PeriodMdl = require('../model/periodMdl');
var ForecastMdl = require('../model/forecastMdl');
var HorizonMdl = require('../model/horizonMdl');
var DataColors = require('./dataColors');

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

var isIE = (function() {
    var ua = window.navigator.userAgent;
    var old_ie = ua.indexOf('MSIE ');
    var new_ie = ua.indexOf('Trident/');
    return (old_ie > -1) || (new_ie > -1);
})();

module.exports = React.createClass({displayName: 'TableArea',
    propTypes: {
        coverage: React.PropTypes.string
    },

    // add State name, Coverage name
    // add predicted values as well

    render: function() {
        var showForecast = ForecastMdl.getForecast()=='On' && HorizonMdl.getHorizon()==1;
        
        if(this.state.detailData === null) return null;
        var stateData = this.state.detailData;
        var firstMetric = (Object.keys(stateData.metrics))[0];
        var firstCoverage = (Object.keys(stateData.metrics[firstMetric]))[0];
        var numMonths = stateData.metrics[firstMetric][firstCoverage].predicted.length;

        var csvData = 'State: ' + this.state.selectedState +
            '\nCoverage: ' + this.state.selectedCvg + '\n\n';

        /*jshint ignore:start */
        var headerEls = [];
        headerEls.push(React.DOM.th(null, "Month"));
        csvData += 'Month';
        Object.keys(stateData.metrics).forEach(function(item, idx) {
            headerEls.push(React.DOM.th(null, item));
            csvData += ',' + item + ' (actual),' + item + ' (expected)';
        });
        csvData += '\n';

        var that = this;
        var rows = [];
            
        var startMonth = stateData.startMonth;
        var startYear = stateData.startYear;
            
        if (PeriodMdl.getPeriod() == 'R12') {
            //startMonth += 11;
            if (startMonth >= 12) {
                startYear = startYear + 1;
                startMonth = startMonth - 12;
            }
        }
            
        for(var moIdx = 0; moIdx < numMonths; moIdx++) {
            var rowEls = [];
            var monthName = months[(startMonth + moIdx) % 12];
            var yearName = startYear + Math.floor((startMonth + moIdx) / 12);

            if(moIdx === this.state.expandedRow) {
                rowEls.push(React.DOM.td({className: "dtl-table-datecol"}, React.DOM.p(null, monthName + ' ' + yearName), React.DOM.p({className: "dtl-table-expected"}, "Expected")));
            } else {
                rowEls.push(React.DOM.td({className: "dtl-table-datecol"}, monthName + ' ' + yearName));
            }
            csvData += monthName + ' ' + yearName;
            Object.keys(stateData.metrics).forEach(function(item, idx) {
                var actual = stateData.metrics[item][that.props.coverage].actual[moIdx];
                var predicted = stateData.metrics[item][that.props.coverage].predicted[moIdx];
                var bkgdColor = DataColors.scale((actual - predicted) / stateData.metrics[item][that.props.coverage].stddev);
                var cellstyle = {
                    background: bkgdColor
                };

                if(moIdx === that.state.expandedRow) {
                    rowEls.push(React.DOM.td(null, React.DOM.p({style: cellstyle}, Formatting.addCommas(actual)), React.DOM.p({className: "dtl-table-expected"}, Formatting.addCommas(predicted))));
                } else {
                    rowEls.push(React.DOM.td(null, React.DOM.p({style: cellstyle}, Formatting.addCommas(actual))));
                }
                csvData += ',' + actual + ',' + predicted;
            });
            csvData += '\n';
            if(moIdx === this.state.expandedRow) rows.push(React.DOM.tr({className: "dtl-table-exprow", onClick: this.selectRow.bind(this, moIdx)}, rowEls));
            else if((startMonth + moIdx) % 12 === 0) rows.push(React.DOM.tr({className: "dtl-table-yrrow", onClick: this.selectRow.bind(this, moIdx)}, rowEls));
            else rows.push(React.DOM.tr({onClick: this.selectRow.bind(this, moIdx)}, rowEls));
        }
        
        if (showForecast) {
            var rowsForecast = [];
            
            var numMonthsForecast = stateData.metrics[firstMetric][firstCoverage].forecast.values.length;
            var startMonthForecast = (startMonth + numMonths) % 12;
            var startYearForecast = startYear + Math.floor((startMonth + numMonths) / 12);
            
            for(var moIdx = 0; moIdx < numMonthsForecast; moIdx++) {
                var rowEls = [];
                var monthName = months[(startMonthForecast + moIdx) % 12];
                var yearName = startYearForecast + Math.floor((startMonthForecast + moIdx) / 12);

                rowEls.push(React.DOM.td({className: "dtl-table-datecol"}, monthName + ' ' + yearName));
                csvData += monthName + ' ' + yearName;
                Object.keys(stateData.metrics).forEach(function(item, idx) {
                    var actual = '';
                    var predicted = stateData.metrics[item][that.props.coverage].forecast.values[moIdx];
                    var bkgdColor = DataColors.scale(0);
                    var cellstyle = {
                        background: bkgdColor
                    };

                    rowEls.push(React.DOM.td(null, React.DOM.p({style: cellstyle}, Formatting.addCommas(predicted))));
                    csvData += ',' + actual + ',' + predicted;
                });
                csvData += '\n';
                if((startMonthForecast + moIdx) % 12 === 0) rowsForecast.push(React.DOM.tr({className: "dtl-table-yrrow"}, rowEls));
                else rowsForecast.push(React.DOM.tr(null, rowEls));
            }
            
        }
        
        /*jshint ignore:end */

        var downloadLink = null;
        if(!isIE) {
            /*jshint ignore:start */
            var dataHref = URL.createObjectURL(new Blob([csvData]));
            downloadLink = React.DOM.a({href: dataHref, download: "data.csv", type: "text/csv", id: "dtl-table-hdrlink", className: "primary-link", onClick: this.downloadData}, 
                React.DOM.span({className: "primary-link-icon fa fa-download"}), 
                React.DOM.span({className: "primary-link-txt"}, "Download Data")
            )
            /*jshint ignore:end */
        } else {
            /*jshint ignore:start */
            var dataHref = URL.createObjectURL(new Blob([]));
            downloadLink = React.DOM.a({href: dataHref, type: "text/csv", id: "dtl-table-hdrlink", className: "primary-link", onClick: this.downloadForIE.bind(this,csvData)}, 
                React.DOM.span({className: "primary-link-icon fa fa-download"}), 
                React.DOM.span({className: "primary-link-txt"}, "Download Data")
            )
            /*jshint ignore:end */            
        }

        return (
            /*jshint ignore:start */
            React.DOM.div(null, 
                React.DOM.div({id: "dtl-table-header"}, 
                    React.DOM.p({id: "dtl-table-title", className: "section-title"}, "Actual Values"), 
                    React.DOM.p({className: "note-txt"}, "Click any row to see expected values"), 
                    downloadLink
                ), 
                React.DOM.table({id: "dtl-table"}, 
                    React.DOM.thead(null, React.DOM.tr(null, headerEls)), 
                    React.DOM.tbody(null, rows)
                ), 
            
             showForecast ?
            
              React.DOM.span(null, 
                React.DOM.div({id: "dtl-forecast-table-header"}, 
                    React.DOM.p({id: "dtl-table-title", className: "section-title"}, "Forecasted Values"), " "
                ), 
                React.DOM.table({id: "dtl-table"}, 
                    React.DOM.thead(null, React.DOM.tr(null, headerEls)), 
                    React.DOM.tbody(null, rowsForecast)
                )
              )

                :

              React.DOM.span(null)

            
            
            )
            
            /*jshint ignore:end */
        );
    },

    getInitialState: function() {
        return {
            metrics: OverviewDataMdl.getData() ? OverviewDataMdl.getData().metricsNames : [],
            detailData: DetailDataMdl.getData(),
            expandedRow: -1,
            selectedCvg: CoverageMdl.getCoverage(),
            selectedState: StateMdl.getState()
        };
    },
    componentDidMount: function() {
        OverviewDataMdl.onChange(this.onDataChange);
        DetailDataMdl.onChange(this.onDtlDataChange);
        StateMdl.onChange(this.onSelectedStateChange);
        CoverageMdl.onChange(this.onCvgChange);
    },
    componentWillUnmount: function() {
        OverviewDataMdl.offChange(this.onDataChange);
        DetailDataMdl.offChange(this.onDtlDataChange);
        StateMdl.offChange(this.onSelectedStateChange);
        CoverageMdl.offChange(this.onCvgChange);
    },
    onDtlDataChange: function() {
        this.setState({
            detailData: DetailDataMdl.getData()
        });
    },
    onSelectedStateChange: function() {
        this.setState({
            selectedState: StateMdl.getState()
        });
    },
    onCvgChange: function() {
        this.setState({
            selectedCvg: CoverageMdl.getCoverage()
        });
    },
    onDataChange: function() {
        var data = OverviewDataMdl.getData();
        this.setState({
            metrics: data.metricsNames
        });
    },
    selectRow: function(idx) {
        var row = -1;
        if(this.state.expandedRow !== idx) row = idx;
        this.setState({
            expandedRow: row
        });
    },
    downloadForIE: function(csvData) {
        var blobObject = new Blob([csvData]);
        window.navigator.msSaveBlob(blobObject, 'data.csv'); 
    }
});

},{"../core/formatting":15,"../model/coverageMdl":18,"../model/detailDataMdl":20,"../model/forecastMdl":21,"../model/horizonMdl":22,"../model/overviewDataMdl":24,"../model/periodMdl":25,"../model/stateMdl":27,"./dataColors":32}],36:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */
var CoverageMdl = require('../model/coverageMdl');
var ForecastMdl = require('../model/forecastMdl');
var HorizonMdl = require('../model/horizonMdl');
var MetricMdl = require('../model/metricMdl');
var DateRangeMdl = require('../model/dateRangeMdl');
var ShowSelectedChartMdl = require('../model/showSelectedChartMdl');

var stddevfactor = 1.96;

module.exports = React.createClass({displayName: 'TrendChart',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable,
        data: React.PropTypes.object,
        startDate: React.PropTypes.number
    },

    drawChart: function(el, props) {
        var showForecast = ForecastMdl.getForecast()=='On' && HorizonMdl.getHorizon()==1;
        
        if (showForecast) {
            var length = props.data.actual.length + props.data.forecast.values.length;
        } else {
            var length = props.data.actual.length;
        }
           
        d3.selectAll(el.childNodes).remove();
        var margin = { top: 12, left: 40, bottom: 18, right: 12 };
        var rect = el.getBoundingClientRect();
        var w = rect.width - margin.left - margin.right;
        var h = rect.height - margin.top - margin.bottom;
        if(!props.data.actual) return; // TEMP while we have empty data sets
        var xScale = d3.scale.linear()
            .domain([0, length])
            .range([0, w]);            
        var yMax = d3.max([
            d3.max(props.data.actual),
            d3.max(props.data.predicted, function(item) { return item + props.data.stddev * stddevfactor;})
        ]);
        var yMin = d3.min([
            0,
            d3.min(props.data.actual),
            d3.min(props.data.predicted, function(item) { return item - props.data.stddev * stddevfactor;})
        ]);
        
        if (showForecast) {
            for (var i = 0; i < props.data.forecast.values.length; i++) {
                var y = props.data.forecast.values[i] + props.data.forecast.std[i] * stddevfactor;
                if (y > yMax) yMax = y;
                
                var y = props.data.forecast.values[i] - props.data.forecast.std[i] * stddevfactor;
                if (y < yMin) yMin = y;
            }
        }
        
        var yScale = d3.scale.linear()
            .domain([yMin, yMax])
            .range([h, 0]);
        var svg = d3.select(el)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        var area = d3.svg.area()
            .x(function(d, i) { return xScale(i); })
            .y0(function(d) { return yScale(d - props.data.stddev * stddevfactor); })
            .y1(function(d) { return yScale(d + props.data.stddev * stddevfactor); });
        svg.append("path")
            .attr("class", "tchart-area")
            .attr("d", area(props.data.predicted));
        
        if (showForecast) {
            var lastPredictedIndex = props.data.predicted.length - 1;
            var lastPredictedValue = props.data.predicted[lastPredictedIndex];
            var lastPredictedStd = props.data.stddev;
            var forecastValues = [lastPredictedValue].concat(props.data.forecast.values);
            var forecastStds = [lastPredictedStd].concat(props.data.forecast.std);
                                       
            var forecastArea = d3.svg.area()
                .x(function(d, i) { return xScale(lastPredictedIndex + i); })
                .y0(function(d, i) { return yScale(d - forecastStds[i] * stddevfactor); })
                .y1(function(d, i) { return yScale(d + forecastStds[i] * stddevfactor); });
            svg.append("path")
                .attr("class", "tchart-area-forecast")
                .attr("d", forecastArea(forecastValues));
        }
            
        var tickVals = [];
        var tickLabels = [];
        for(var i = 0; i < length; i++) {
            var date = props.startDate + i;
            if(date % 12 === 0) {
                tickVals.push(i);
                tickLabels.push('' + (1970 + Math.floor(date / 12)));
            }
        }
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickSize(-h, 0)
            .tickPadding(6)
            .tickValues(tickVals)
            .tickFormat(function(d, i) {
                return tickLabels[i];
            });
        svg.append("g")
            .attr("class", "hdr-x tchart-axis")
            .attr("transform", "translate(0," + h + ")")
            .call(xAxis);

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .tickSize(0, 0)
            .tickFormat(function(d, i) {
                if (d == yMin) return '';
                if(d < 1000) return d;
                if(d < 10000) return Math.round(d / 100) / 10 + ' K';
                if(d < 1000000) return (d / 1000).toFixed(0) + ' K';
                if(d < 10000000) return Math.round(d / 100000) / 10 + ' M';
                return (d / 1000000).toFixed(0) + ' M';
            })
            .orient("left");
        svg.append("g")
            .attr("class", "hdr-y tchart-axis")
            .call(yAxis);

        var line = d3.svg.line()
            .x(function(d, i) { return xScale(i); })
            .y(function(d) { return yScale(d); });
        svg.append("path")
            .attr("class", "tchart-actual")
            .attr("d", line(props.data.actual));
        
        var selectedMetric = MetricMdl.getMetric();
        var showSelectedChart = ShowSelectedChartMdl.getShowSelectedChart();
/*       if (this.props.title == selectedMetric && showSelectedChart == 'On') {
            var i = DateRangeMdl.getRangeStart() - props.startDate;
            var d = props.data.actual[i];
            svg.append("circle")
                .attr("cx", xScale(i))
                .attr("cy", yScale(d))
                .attr("r", 3)
                .attr("fill", "rgba(255,0,0,0.5)");
        } */
        
    },

    render: function() {
        var className = 'tchart';
        var selectedMetric = MetricMdl.getMetric();
        var showSelectedChart = ShowSelectedChartMdl.getShowSelectedChart();
        if (this.props.title == selectedMetric && showSelectedChart == 'On') {
            className = 'tchart-selected-metric';
        }
        return (
            /*jshint ignore:start */
            React.DOM.div({id: this.props.id, className: className}, 
                React.DOM.p({className: "tchart-title"}, this.props.title + ' - ' + this.state.selectedCvg), 
                React.DOM.svg({className: "tchart-svg", ref: "svg"})
            )
            /*jshint ignore:end */
        );
    },

    getInitialState: function() {
        return {
            selectedCvg: CoverageMdl.getCoverage()
        };
    },
    componentDidMount: function() {
        CoverageMdl.onChange(this.onCvgChange);
        this.drawChart(this.refs.svg.getDOMNode(), this.props);
    },
    shouldComponentUpdate: function() {
        this.drawChart(this.refs.svg.getDOMNode(), this.props);
        return false;
    },
    componentWillUnmount: function() {
        CoverageMdl.offChange(this.onCvgChange);
    },
    onCvgChange: function() {
        this.setState({
            selectedCvg: CoverageMdl.getCoverage()
        });
    }
});

},{"../model/coverageMdl":18,"../model/dateRangeMdl":19,"../model/forecastMdl":21,"../model/horizonMdl":22,"../model/metricMdl":23,"../model/showSelectedChartMdl":26}],37:[function(require,module,exports){
"use strict";
/** @jsx React.DOM */
var SuperAgent = window.superagent;
var SelectStateAction = require('../action/selectStateAction');
var StateMdl = require('../model/stateMdl');
var OverviewDataMdl = require('../model/overviewDataMdl');
var MetricMdl = require('../model/metricMdl');
var CoverageMdl = require('../model/coverageMdl');
var DateRangeMdl = require('../model/dateRangeMdl');
var HorizonMdl = require('../model/horizonMdl');
var PeriodMdl = require('../model/periodMdl');
var ShowSelectedChartMdl = require('../model/showSelectedChartMdl');
var Util = require('../core/util');
var States = require('../model/states');
var DataColors = require('./dataColors');

var cloneToDoc = function(node,doc){
    if(!doc) doc=document;
    var i, len;
    var clone = doc.createElementNS(node.namespaceURI,node.nodeName);
    for(i=0,len=node.attributes.length; i<len; ++i) {
        var a = node.attributes[i];
        if(/^xmlns\b/.test(a.nodeName)) continue; // IE can't create these
        clone.setAttributeNS(a.namespaceURI,a.nodeName,a.nodeValue);
    }
    for(i=0,len=node.childNodes.length; i<len; ++i){
        var c = node.childNodes[i];
        clone.insertBefore(c.nodeType==1 ? cloneToDoc(c,doc) : doc.createTextNode(c.nodeValue), null);
    }
    return clone;
};

module.exports = React.createClass({displayName: 'UsMap',

    mapUnscaledWidth: 961.84375,
    mapUnscaledHeight: 582.625,

    drawMap: function(el, props) {
        var that = this;
        d3.selectAll(el.childNodes).remove();
        SuperAgent.get('map.svg').end(function(err, resp) {
            if(err) console.log("err1 " + err);
            else if(resp.error) console.log("err2 " + resp.error);
            else {
                var node = cloneToDoc(resp.xhr.responseXML.documentElement);
                el.appendChild(node);
                var svg = d3.select('#map-svg');
                // add handlers directly, not using D3, has to do with evt handlers on <g>
                // try pointer-events:all
                svg.selectAll('.usmap-state,.usmap-label,.usmap-callout')
                    .on('mouseenter', function() { that.hoverOn(this); })
                    .on('mouseleave', function() { that.hoverOff(this); })
                    .on('mousedown', function() { that.navToState(this); }); // click does not work in IE
                that.renderData();
                that.windowResized();
            }
        });
    },

    renderData: function() {
        var svg = d3.select('#map-svg');
        if(!svg[0][0]) return; // SVG element not yet added
        var data = OverviewDataMdl.getData();
        if(!data) return; // data not yet loaded
        var metric = MetricMdl.getMetric();
        if(metric === null) metric = data.metricsNames[0];
        var metricData = data.metrics[metric];
        var cvg = CoverageMdl.getCoverage();
        if(cvg === null) cvg = data.coverages[0];
        var cvgData = metricData[cvg];
        for(var state in States) {
            var stateName = States[state];
            var stateData = cvgData[stateName.toUpperCase()];
            
            if (stateData) {

                // compute the mean of values for the time range
                var rangeSz = DateRangeMdl.getRangeSize();
                var moIdx = DateRangeMdl.getRangeStart() - data.startDate + data.startDateOffset;
                var valueCt = 0;
                var valueTotal = 0;
                for(var i = 0; i < rangeSz; i++) {
                    if(moIdx >= stateData.length) break;
                    valueTotal += stateData[moIdx];
                    valueCt++;
                    moIdx++;
                }
                var value = valueTotal / valueCt;

                if (value) var color = DataColors.scale(value);
                else var color = 'rgb(248,246,243)';

                svg.selectAll('#' + state + ' .usmap-state').attr('style', 'fill:' + color);
                svg.select('#' + state + ' .usmap-callout').attr('style', 'fill:' + color);
                
            }
        }
    },

    render: function() {
        return (
            /*jshint ignore:start */
            React.DOM.div({id: "usmap", ref: "mapdiv"})
            /*jshint ignore:end */
        );
    },

    componentDidMount: function() {
        this.drawMap(this.getDOMNode(), this.props);

        MetricMdl.onChange(this.renderData);
        CoverageMdl.onChange(this.renderData);
        OverviewDataMdl.onChange(this.renderData);
        DateRangeMdl.onChange(this.renderData);

        if(!this.resizeHandler) this.resizeHandler = Util.debounce(this.windowResized, 300);
        window.addEventListener('resize', this.resizeHandler);
    },

    shouldComponentUpdate: function() {
        return false;
    },

    componentWillUnmount: function() {
        MetricMdl.offChange(this.renderData);
        CoverageMdl.offChange(this.renderData);
        OverviewDataMdl.offChange(this.renderData);
        DateRangeMdl.offChange(this.renderData);
        window.removeEventListener('resize', this.resizeHandler);
    },

    windowResized: function() {
        var svg = d3.select('#map-svg');
        if(!svg[0][0]) return; // SVG element not yet added

        var availWidth = document.body.clientWidth - 310; // margins and filter area add to 310px width
        var scale = availWidth / this.mapUnscaledWidth;
        svg.select('#scaledGrp').attr('transform', 'scale(' + scale + ')');
        svg.attr('width', this.mapUnscaledWidth * scale).attr('height', this.mapUnscaledHeight * scale);
    },

    // when moving node to the top, mouseleave no longer works in IE
    
    hoverOn: function(el) {
        /*
        var stateNode = el.parentNode;
        var groupNode = stateNode.parentNode;
        groupNode.removeChild(stateNode);
        groupNode.appendChild(stateNode);
        d3.select(stateNode).classed('state-hover', true);
        */
    },

    hoverOff: function(el) {
        /*
        var stateNode = el.parentNode;
        d3.select(stateNode).classed('state-hover', false);
        */
    },

    navToState: function(el) {
        ShowSelectedChartMdl.setShowSelectedChart('On');
        var horizon = HorizonMdl.getHorizon();
        var period = PeriodMdl.getPeriod();
        var stateNode = el.parentNode;
        SelectStateAction.exec(horizon, period, stateNode.id);
        return false;
    }
});

},{"../action/selectStateAction":4,"../core/util":17,"../model/coverageMdl":18,"../model/dateRangeMdl":19,"../model/horizonMdl":22,"../model/metricMdl":23,"../model/overviewDataMdl":24,"../model/periodMdl":25,"../model/showSelectedChartMdl":26,"../model/stateMdl":27,"../model/states":29,"./dataColors":32}]},{},[5])


//# sourceMappingURL=bundle.js.map