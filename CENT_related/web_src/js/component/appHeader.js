/** @jsx React.DOM */

module.exports = React.createClass({displayName: 'AppHeader',

    propTypes: {
        id: React.PropTypes.string,
        title: React.PropTypes.renderable.isRequired,
        onShowAbout: React.PropTypes.func
    },

    render: function() {
        return (
            /*jshint ignore:start */
            <div className='apphdr' id={this.props.id}>
                <p className='apphdr-title'>{this.props.title}</p>
                <a className='apphdr-about' href='#' onClick={this.showAbout}>About</a>
            </div>
            /*jshint ignore:end */
        );
    },

    showAbout: function() {
        this.props.onShowAbout();
        return false;
    }
});
