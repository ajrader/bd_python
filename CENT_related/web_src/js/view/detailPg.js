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
            <div>
                <AppHeader title='Claims Early Notification Tool'/>
                <div id='dtl-content'>
                    <p id='dtl-title' className='page-title'>
                        <a href='#' id='dtl-back' className='fa fa-chevron-left' onClick={this.navBack}></a>
                        {States[this.state.selectedState]} Details
                    </p>
                    <div id='dtl-main-area'>
                        { (this.state.selectedStateView === StateViewMdl.ViewState.CHARTS) ? <ChartsArea coverage={this.state.selectedCvg}/> : <TableArea coverage={this.state.selectedCvg}/> }
                    </div>
                    <div id='dtl-filter-area'>
                        <ToggleChooser id='dtl-view-toggle' title='View' items={[ 'Charts', 'Table' ]} selectedItem={this.state.selectedStateView} onItemSelect={this.onStateViewSelect}/>
                         <DropdownChooser id='dtl-horizon-filter' title='New Trends Detected' items={newTrendsDetectedLabels} selectedItem={newTrendsDetectedLabel} onItemSelect={this.onHorizonSelect}/>
                        { (this.state.selectedHorizon == 1) ? <ToggleChooser id='dtl-forecast-filter' title='Forecast' items={['On', 'Off']} selectedItem={this.state.selectedForecast} onItemSelect={this.onForecastSelect}/> : <span></span> }
                        <ToggleChooser id='dtl-period-filter' title='Rolling 12 or Monthly' items={this.state.periods} selectedItem={this.state.selectedPeriod} onItemSelect={this.onPeriodSelect}/>
                        <ListChooser id='dtl-cvg-filter' title='Coverage / Segment' items={this.state.cvgs} selectedItem={this.state.selectedCvg} onItemSelect={this.onCvgSelect}/>
                        { (this.state.selectedStateView === StateViewMdl.ViewState.CHARTS) ? <Legend categories={chartCats}/> : <Legend categories={this.tableCats}/> }
                    </div>
                </div>
            </div>
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
