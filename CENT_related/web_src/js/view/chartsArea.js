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
            /*jshint ignore:start */
            charts.push(<TrendChart id={'tchart-' + charts.length} key={metricName + this.props.coverage}
                title={metricName} startDate={startDate} data={stateData.metrics[metricName][this.props.coverage]}/>);
            /*jshint ignore:end */
        }
        return (
            /*jshint ignore:start */
            <div id='detail-charts'>{charts}</div>
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
