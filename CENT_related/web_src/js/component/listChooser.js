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
                return <li className='listchooser-item-selected' key={item}>
                           { itemIsSegment ? <strong>{item}</strong> : <span>{item}</span> }
                       </li>;
            } else {
                return <li className='listchooser-item' key={item} onClick={that.selectItem.bind(that, item)}>
                           { itemIsSegment ? <strong>{item}</strong> : <span>{item}</span> }
                       </li>;
            }
            /*jshint ignore:end */
        });
        return (
            /*jshint ignore:start */
            <div id={this.props.id}>
                <p className='section-title'>{this.props.title}</p>
                <ul className='listchooser-list'>{listItems}</ul>
            </div>
            /*jshint ignore:end */
        );
    },

    selectItem: function(item) {
        this.props.onItemSelect(item);
        return false;
    }
});
