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
                return <li className='togglechooser-item-selected' key={item} style={itemStyle}>{item}</li>;
            } else {
                return <li className='togglechooser-item' key={item} style={itemStyle} onClick={that.selectItem.bind(that, item)}>{item}</li>;
            }
            /*jshint ignore:end */
        });
        return (
            /*jshint ignore:start */
            <div id={this.props.id}>
                <p className='section-title'>{this.props.title}</p>
                <ul className='togglechooser-list'>{listItems}</ul>
            </div>
            /*jshint ignore:end */
        );
    },

    selectItem: function(item) {
        this.props.onItemSelect(item);
        return false;
    }
});
