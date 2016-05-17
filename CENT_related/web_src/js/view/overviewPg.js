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
            <div>
                <AppHeader title='Claims Early Notification Tool'/>
                <div id='oview-content'>
                    <p id='oview-title' className='page-title'>Explore</p>
                    <div id='oview-map-area'>
                        <TimeSlider id='oview-time-filter' numMonths={this.state.numMonths} firstMonth={this.state.firstMonth} rangeStart={this.state.rangeStart} rangeSize={this.state.rangeSize} onRangeChange={this.onRangeChange}/>
                        <UsMap/>
                        <p id='oview-map-note' className='note-txt'>Click any state for detailed charts</p>
                    </div>
                    <div id='oview-filter-area'>
                        <DropdownChooser id='oview-horizon-filter' title='New Trends Detected' items={newTrendsDetectedLabels} selectedItem={newTrendsDetectedLabel} onItemSelect={this.onHorizonSelect}/>
                        <ToggleChooser id='oview-period-filter' title='Rolling 12 or Monthly' items={this.state.periods} selectedItem={this.state.selectedPeriod} onItemSelect={this.onPeriodSelect}/>
                        <ListChooser id='oview-cvg-filter' title='Coverage / Segment' items={this.state.cvgs} selectedItem={this.state.selectedCvg} onItemSelect={this.onCvgSelect}/>
                        <ListChooser id='oview-metrics-filter' title='Metrics' items={this.state.metrics} selectedItem={this.state.selectedMetric} onItemSelect={this.onMetricSelect}/>
                        <Legend categories={legendCats} hasMargins={false}/>
                    </div>
                    <p id='oview-title-2' className='page-title'>Highlights</p>
                    <p id='oview-title-smaller' className='page-title-smaller'>Injury</p>
                    <div id='oview-table-col1'>
                        <p id='oview-section-title' className='section-title'>Top above range</p>
                        <table id='oview-table'>
                            <tbody>{this.getTableRows('Injury', 'top')}</tbody>
                        </table>
                    </div>
                    <div id='oview-table-col2'>
                        <p id='oview-section-title' className='section-title'>Top below range</p>
                        <table id='oview-table'>
                            <tbody>{this.getTableRows('Injury', 'bottom')}</tbody>
                        </table>
                    </div>
                    <p id='oview-title-smaller' className='page-title-smaller'>PIP/MPC</p>
                    <div id='oview-table-col1'>
                        <p id='oview-section-title' className='section-title'>Top above range</p>
                        <table id='oview-table'>
                            <tbody>{this.getTableRows('PIP/MPC', 'top')}</tbody>
                        </table>
                    </div>
                    <div id='oview-table-col2'>
                        <p id='oview-section-title' className='section-title'>Top below range</p>
                        <table id='oview-table'>
                            <tbody>{this.getTableRows('PIP/MPC', 'bottom')}</tbody>
                        </table>
                    </div>
                    <p id='oview-title-smaller' className='page-title-smaller'>Property</p>
                    <div id='oview-table-col1'>
                        <p id='oview-section-title' className='section-title'>Top above range</p>
                        <table id='oview-table'>
                            <tbody>{this.getTableRows('Property', 'top')}</tbody>
                        </table>
                    </div>
                    <div id='oview-table-col2'>
                        <p id='oview-section-title' className='section-title'>Top below range</p>
                        <table id='oview-table'>
                            <tbody>{this.getTableRows('Property', 'bottom')}</tbody>
                        </table>
                    </div>
                </div>
            </div>
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
                <tr onClick={this.selectRow.bind(this, rowData)}>
                  <td style={colorStyle}>&nbsp;</td>
                  <td style={stateStyle}>{rowData.state.toLowerCase()}</td>
                  <td style={cellPadding}>{rowData.cvg}</td>
                  <td style={cellPadding}>{rowData.metric}</td>
                </tr>

                /*jshint ignore:end */
            );
        }
                                    
        return tableRows;
    }
});
