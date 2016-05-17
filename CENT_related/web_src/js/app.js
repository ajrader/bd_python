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
            <div>{ this.state.selectedState === null ? <OverviewPg/> : <DetailPg/> }</div>
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
    <App/>,
    /*jshint ignore:end */
    document.body
);
