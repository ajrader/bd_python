/** @jsx React.DOM */

module.exports = React.createClass({displayName: 'Legend',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable,
        categories: React.PropTypes.arrayOf(React.PropTypes.shape(
            {
                name: React.PropTypes.renderable,
                color: React.PropTypes.renderable,
                borderColor: React.PropTypes.renderable
            }  
        )),
        hasMargins: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            title: 'Legend',
            categories: [],
            hasMargins: true
        };
    },

    render: function() {
        if (this.props.hasMargins) {
            
            var categoryItems = this.props.categories.map(function(cat) {
                var colorStyle = { background: cat.color, border: '1px solid ' + cat.borderColor };

                /*jshint ignore:start */
                return <li className='legend-item' key={cat.name}>
                    <span className='legend-color' style={colorStyle}></span>
                    <span className='legend-name'>{cat.name}</span>
                </li>
                /*jshint ignore:end */
            });
            return (
                /*jshint ignore:start */
                <div id={this.props.id}>
                    <p className='section-title'>{this.props.title}</p>
                    <ul className='legend-area'>{categoryItems}</ul>
                </div>
                /*jshint ignore:end */
            );
            
        } else {
            
            var categoryItems = [];
            for (var i=0; i<this.props.categories.length; i++) {
                var cat = this.props.categories[i];
                var colorStyle = { background: cat.color, border: '1px solid ' + cat.borderColor };
                
                if (i==0) var className = 'legend-color-no-margin-top';
                else if (i==this.props.categories.length-1) var className = 'legend-color-no-margin-bottom';
                else var className = 'legend-color-no-margin-middle';
                
                categoryItems.push(
                    /*jshint ignore:start */
                    <li className='legend-item-no-margin' key={cat.name}>
                        <span className={className} style={colorStyle}></span>
                        <span className='legend-name'>{cat.name}</span>
                    </li>
                    /*jshint ignore:end */
                );
            }
            return (
                /*jshint ignore:start */
                <div id={this.props.id}>
                    <p className='section-title'>{this.props.title}</p>
                    <ul className='legend-area'>{categoryItems}</ul>
                </div>
                /*jshint ignore:end */
            );
            
        }
    }
});
