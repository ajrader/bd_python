/** @jsx React.DOM */

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

module.exports = React.createClass({displayName: 'TimeSlider',

    propTypes: {
        id: React.PropTypes.string,
        numMonths: React.PropTypes.number,
        firstMonth: React.PropTypes.number,
        rangeStart: React.PropTypes.number,
        rangeSize: React.PropTypes.number,
        onRangeChange: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            numMonths: -1,
            firstMonth: -1,
            rangeStart: -1,
            rangeSize: 1
        };
    },

    render: function() {
        var rangeTxt = 'Date Range';
        if(this.props.rangeStart > 0) {
            var startYr = 1970 + Math.floor(this.props.rangeStart / 12);
            var rangeEnd = this.props.rangeStart + this.props.rangeSize - 1;
            var endYr = 1970 + Math.floor(rangeEnd / 12);
            rangeTxt = months[this.props.rangeStart % 12] + ' ' + startYr;
        }

        /*jshint ignore:start */

        var yrSections = [];
        var thumb = null;
        if(this.props.numMonths && this.props.firstMonth) {
            var sectionWidthPercent = 100 * 12 / this.props.numMonths;
            for(var mo = this.props.firstMonth; mo < this.props.firstMonth + this.props.numMonths; mo++) {
                if(mo % 12 === 0) { // January
                    var offsetPercent = 100 * (mo - this.props.firstMonth) / this.props.numMonths;
                    var sectionStyle = { left: offsetPercent + '%', width: sectionWidthPercent + '%' };
                    var barStyle = {}
                    if(mo === this.props.firstMonth) barStyle['border-left'] = 'none';

                    yrSections.push(<div className='tslider-section' key={mo} style={sectionStyle}>
                        <div className='tslider-sectionbar' style={barStyle}></div>
                        <p className='tslider-sectiontxt'>{1970 + Math.floor(mo / 12)}</p>
                    </div>);
                } else if(mo % 3 === 0) { // April, July, October
                    var offsetPercent = 100 * (mo - this.props.firstMonth) / this.props.numMonths;
                    var sectionStyle = { left: offsetPercent + '%', width: sectionWidthPercent + '%' };
                    var barStyle = {}
                    if(mo === this.props.firstMonth) barStyle['border-left'] = 'none';

                    yrSections.push(<div className='tslider-section' key={mo} style={sectionStyle}>
                        <div className='tslider-sectionbar-minor' style={barStyle}></div>
                    </div>);
                }                  
            }

            var thumbOffset = 100 * (this.props.rangeStart - this.props.firstMonth) / this.props.numMonths;
            thumbOffset = Math.max(0, Math.min(100, thumbOffset));
            var thumbWidth = 100 * this.props.rangeSize / this.props.numMonths;
            thumbWidth = Math.max(0, Math.min(100 - thumbOffset, thumbWidth));
            var thumbStyle = { left: thumbOffset + '%', width: 'calc(' + thumbWidth + '% + 1px)' };
            thumb = <div className='tslider-thumb' ref='thumb' style={thumbStyle} onMouseDown={this.onMouseDown}></div>
        }
        /*jshint ignore:end */

        return (
            /*jshint ignore:start */
            <div id={this.props.id}>
                <div className='tslider-titlebar'>
                    <p className='section-title tslider-title'>{rangeTxt}</p>
                </div>
                <div className='tslider-content' ref='track' onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave}>
                    {yrSections}
                    {thumb}
                </div>
            </div>
            /*jshint ignore:end */
        );
    },

    getInitialState: function() {
        return {
            dragging: false,
            delta: 0,
            offsetPercent: 0
        };
    },

    selectRangeSz: function(value) {
        this.props.onRangeChange(this.props.rangeStart, value);
        return false;
    },

    onMouseDown: function(e) {
        if(e.button !== 0) return; // left button
        var thumbOffset = this.refs.thumb.getDOMNode().getBoundingClientRect().left;
        this.setState({
            dragging: true,
            delta: e.nativeEvent.pageX - thumbOffset
        });
        return false;
    },
    onMouseMove: function(e) {
        if(!this.state.dragging) return;
        var trackOffset = this.refs.track.getDOMNode().getBoundingClientRect().left;
        var trackWidth = this.refs.track.getDOMNode().clientWidth;
        var offset = e.nativeEvent.pageX - this.state.delta - trackOffset;
        var offsetPercent = 100 * offset / trackWidth;
        var nearestMonth = this.props.firstMonth + Math.round(offsetPercent * this.props.numMonths / 100);
        nearestMonth = Math.max(this.props.firstMonth, Math.min(this.props.firstMonth + this.props.numMonths - 1, nearestMonth));
        if(nearestMonth != this.props.rangeStart) this.props.onRangeChange(nearestMonth, this.props.rangeSize);
        return false;
    },
    onMouseUp: function(e) {
        if(this.state.dragging) {
            this.setState({
                dragging: false
            });
        } else {
            var trackOffset = this.refs.track.getDOMNode().getBoundingClientRect().left;
            var trackWidth = this.refs.track.getDOMNode().clientWidth;
            var offset = e.nativeEvent.pageX - trackOffset;
            var offsetPercent = 100 * offset / trackWidth;
            var nearestMonth = this.props.firstMonth + Math.round(offsetPercent * this.props.numMonths / 100);
            nearestMonth = Math.max(this.props.firstMonth, Math.min(this.props.firstMonth + this.props.numMonths - 1, nearestMonth));
            if(nearestMonth != this.props.rangeStart) this.props.onRangeChange(nearestMonth, this.props.rangeSize);
        }
        return false;
    },
    onMouseLeave: function(e) {
        this.setState({
            dragging: false
        });
        return false;
    }
});
