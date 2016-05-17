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
            <div id='usmap' ref='mapdiv'></div>
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
