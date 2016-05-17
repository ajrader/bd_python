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
        headerEls.push(<th>Month</th>);
        csvData += 'Month';
        Object.keys(stateData.metrics).forEach(function(item, idx) {
            headerEls.push(<th>{item}</th>);
            csvData += ',' + item + ' (actual),' + item + ' (expected)';
        });
        csvData += '\n';

        var that = this;
        var rows = [];
            
        var startMonth = stateData.startMonth;
        var startYear = stateData.startYear;
            
        if (PeriodMdl.getPeriod() == 'R12') {
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
                rowEls.push(<td className='dtl-table-datecol'><p>{monthName + ' ' + yearName}</p><p className='dtl-table-expected'>Expected</p></td>);
            } else {
                rowEls.push(<td className='dtl-table-datecol'>{monthName + ' ' + yearName}</td>);
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
                    rowEls.push(<td><p style={cellstyle}>{Formatting.addCommas(actual)}</p><p className='dtl-table-expected'>{Formatting.addCommas(predicted)}</p></td>);
                } else {
                    rowEls.push(<td><p style={cellstyle}>{Formatting.addCommas(actual)}</p></td>);
                }
                csvData += ',' + actual + ',' + predicted;
            });
            csvData += '\n';
            if(moIdx === this.state.expandedRow) rows.push(<tr className='dtl-table-exprow' onClick={this.selectRow.bind(this, moIdx)}>{rowEls}</tr>);
            else if((startMonth + moIdx) % 12 === 0) rows.push(<tr className='dtl-table-yrrow' onClick={this.selectRow.bind(this, moIdx)}>{rowEls}</tr>);
            else rows.push(<tr onClick={this.selectRow.bind(this, moIdx)}>{rowEls}</tr>);
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

                rowEls.push(<td className='dtl-table-datecol'>{monthName + ' ' + yearName}</td>);
                csvData += monthName + ' ' + yearName;
                Object.keys(stateData.metrics).forEach(function(item, idx) {
                    var actual = '';
                    var predicted = stateData.metrics[item][that.props.coverage].forecast.values[moIdx];
                    var bkgdColor = DataColors.scale(0);
                    var cellstyle = {
                        background: bkgdColor
                    };

                    rowEls.push(<td><p style={cellstyle}>{Formatting.addCommas(predicted)}</p></td>);
                    csvData += ',' + actual + ',' + predicted;
                });
                csvData += '\n';
                if((startMonthForecast + moIdx) % 12 === 0) rowsForecast.push(<tr className='dtl-table-yrrow'>{rowEls}</tr>);
                else rowsForecast.push(<tr>{rowEls}</tr>);
            }
            
        }
        
        /*jshint ignore:end */

        var downloadLink = null;
        if(!isIE) {
            /*jshint ignore:start */
            var dataHref = URL.createObjectURL(new Blob([csvData]));
            downloadLink = <a href={dataHref} download='data.csv' type='text/csv' id='dtl-table-hdrlink' className='primary-link' onClick={this.downloadData}>
                <span className='primary-link-icon fa fa-download'/>
                <span className='primary-link-txt'>Download Data</span>
            </a>
            /*jshint ignore:end */
        } else {
            /*jshint ignore:start */
            var dataHref = URL.createObjectURL(new Blob([]));
            downloadLink = <a href={dataHref} type='text/csv' id='dtl-table-hdrlink' className='primary-link' onClick={this.downloadForIE.bind(this,csvData)}>
                <span className='primary-link-icon fa fa-download'/>
                <span className='primary-link-txt'>Download Data</span>
            </a>
            /*jshint ignore:end */            
        }

        return (
            /*jshint ignore:start */
            <div>
                <div id='dtl-table-header'>
                    <p id='dtl-table-title' className='section-title'>Actual Values</p>
                    <p className='note-txt'>Click any row to see expected values</p>
                    {downloadLink}
                </div>
                <table id='dtl-table'>
                    <thead><tr>{headerEls}</tr></thead>
                    <tbody>{rows}</tbody>
                </table>
            
            { showForecast ?
            
              <span>
                <div id='dtl-forecast-table-header'>
                    <p id='dtl-table-title' className='section-title'>Forecasted Values</p>&nbsp;
                </div>
                <table id='dtl-table'>
                    <thead><tr>{headerEls}</tr></thead>
                    <tbody>{rowsForecast}</tbody>
                </table>
              </span>

                :

              <span></span>

            }
            
            </div>
            
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
