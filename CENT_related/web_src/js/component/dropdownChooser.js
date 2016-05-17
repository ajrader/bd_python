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
            return <li className='ddchooser-item' key={item} onClick={that.selectItem.bind(that, item)}><a href='#'>{item}</a></li>;
            /*jshint ignore:end */
        });

        return (
            /*jshint ignore:start */
            <div id={this.props.id}>
                <p className='section-title'>{this.props.title}</p>
                <a href='#' className='ddchooser-toggle' onClick={this.toggleExpand}>
                    <span className='ddchooser-toggle-name'>{this.props.selectedItem}</span>
                    <span className='ddchooser-toggle-icon fa fa-caret-down'/>
                </a>
                <ul className={this.state.expanded ? 'ddchooser-popup' : 'ddchooser-popup hidden'}>{listItems}</ul>
            </div>
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
