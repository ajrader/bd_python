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
            <div id={this.props.id} className={className}>
                <p className='tchart-title'>{this.props.title + ' - ' + this.state.selectedCvg}</p>
                <svg className='tchart-svg' ref='svg'></svg>
            </div>
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
