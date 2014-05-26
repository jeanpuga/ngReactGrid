var _ = {
    nativeForEach: Array.prototype.forEach,
    each: function(obj, iterator, context) {
        if (obj == null) return obj;
        if (this.nativeForEach && obj.forEach === this.nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, length = obj.length; i < length; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            var keys = _.keys(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
                if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
            }
        }
        return obj;
    },
    slice: Array.prototype.slice,
    extend: function(obj) {
        this.each(this.slice.call(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    }
};
/**
 * @author Jose Garcia - jose.balius@gmail.com
 * @module ngReactGrid
 */
angular.module("ngReactGrid", [])

/**
 * @directive ngReactGrid
 */
.directive("ngReactGrid", ['ngReactGrid', function(ngReactGrid) {
    return {
        restrict: "E",
        link: function(scope, element, attrs) {
            new ngReactGrid(scope, element, attrs);
        }
    };
}])

/**
 * @factory ngReactGrid
 */
.factory("ngReactGrid", function() {

    var getScrollbarWidth = function() {
        var outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

        document.body.appendChild(outer);

        var widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = "scroll";

        // add innerdiv
        var inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);        

        var widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    };

    var ngReactGrid = function(scope, element, attrs) {
        var render = function(grid) {
            React.renderComponent(ngReactGridComponent({grid:grid}), element[0]);
        };

        var gridDefault = {
            columnDefs: [],
            data: [],
            height: 500,
            scrollbarWidth: getScrollbarWidth(),
            sort: function(field) {

            },
            columnResize: function(field, delta, index) {

            },
            autoColumnResize: function(width, index) {

            }
        };

        var grid = _.extend(gridDefault, scope.grid);

        /**
         * Watchers
         */
        scope.$watch("grid.data", function(newValue, oldValue) {
            _.extend(grid, {data: newValue});
            render(grid);
        });

        render(grid);
    };

    return ngReactGrid;
})
/** @jsx React.DOM */
/**
 * @author Jose Garcia - jose.balius@gmail.com
 * ngReactGrid React component
 */
var ngReactGridComponent = (function() {

    var windowInnerWidth = window.innerWidth, windowInnerHeight = window.innerHeight;

    var setCellWidthPixels = function(cell) {

        var width = String(cell.width).replace("px", "");
        var isPercent = width.indexOf("%") !== -1;

        if(isPercent) {

            var widthInPixels = Math.floor((parseInt(width) * windowInnerWidth) / 100);
            cell.width = widthInPixels;

        }

    };

    var setCellWidth = function(grid, cell, cellStyle, isLast, bodyCell) {

        if(!cell.width) {
            cell.width = "10%";
        }

        if(grid.horizontalScroll) {
            setCellWidthPixels(cell);
        }

        cellStyle.width = cell.width;
    };

    var ngReactGridHeader = (function() {

        var ngGridHeaderCell = React.createClass({displayName: 'ngGridHeaderCell',
            render: function() {

                var cellStyle = {};
                setCellWidth(this.props.grid, this.props.cell, cellStyle, this.props.last);

                return (
                    React.DOM.th( {title:this.props.cell.displayName, style:cellStyle}, 
                        React.DOM.div(null, 
                            this.props.cell.displayName
                        )
                    )
                )
            }
        });

        return React.createClass({
            render: function() {

                var columnsLength = this.props.grid.columnDefs.length;
                var cells = this.props.grid.columnDefs.map(function(cell, key) {
                    var last = (columnsLength - 1) === key;
                    return (ngGridHeaderCell( {key:key, cell:cell, index:key, grid:this.props.grid, last:last} ))
                }.bind(this));

                var tableStyle = {
                    width: "calc(100% - " + this.props.grid.scrollbarWidth + "px)"
                };

                var ngReactGridHeader = {
                    paddingRight: (this.props.grid.horizontalScroll) ? this.props.grid.scrollbarWidth : 0
                };

                return (
                    React.DOM.div( {className:"ngReactGridHeaderWrapper"}, 
                        React.DOM.div( {className:"ngReactGridHeader", style:ngReactGridHeader}, 
                            React.DOM.div(null),
                            React.DOM.div( {className:"ngReactGridHeaderInner"}, 
                                React.DOM.table( {style:tableStyle}, 
                                    React.DOM.thead(null, 
                                        React.DOM.tr(null, 
                                            cells
                                        )
                                    )
                                )
                            )
                        )
                    )
                );
            }
        });
    })();

    var ngReactGridBody = (function() {

        var ngReactGridBodyRowCell = React.createClass({displayName: 'ngReactGridBodyRowCell',
            render: function() {
                var cellText = this.props.row[this.props.cell.field];
                var cellStyle = {};
                setCellWidth(this.props.grid, this.props.cell, cellStyle, this.props.last, true);
                return (
                    React.DOM.td( {style:cellStyle, title:cellText}, 
                        React.DOM.div(null, cellText)
                    )
                )
            }
        });

        var ngReactGridBodyRow = React.createClass({displayName: 'ngReactGridBodyRow',
            render: function() {

                var columnsLength = this.props.grid.columnDefs.length;
                var cells = this.props.grid.columnDefs.map(function(cell, key) {
                    var last = (columnsLength - 1) === key;
                    return ngReactGridBodyRowCell( {key:key, cell:cell, row:this.props.row, grid:this.props.grid, last:last} )
                }.bind(this));

                return (
                    React.DOM.tr(null, 
                        cells
                    )
                )
            }
        });


        return React.createClass({
            getInitialState: function() {
                return {
                    fullRender: false,
                    needsUpdate: false
                }
            },
            calculateIfNeedsUpdate: function() {
                if(this.props.grid.data.length > 100) {
                    this.setState({
                        needsUpdate: true
                    });
                }
            },
            componentWillMount: function() {
                this.calculateIfNeedsUpdate();
            },
            componentWillReceiveProps: function() {
                this.calculateIfNeedsUpdate();
            }, 
            componentDidMount: function() {
                var domNode = this.getDOMNode();
                var header = document.querySelector(".ngReactGridHeaderInner");
                var viewPort = document.querySelector(".ngReactGridViewPort");

                domNode.firstChild.addEventListener('scroll', function(e) {
                    header.scrollLeft = viewPort.scrollLeft;
                });

                if(this.state.needsUpdate) {
                    this.setState({
                        fullRender: true,
                        needsUpdate: false
                    });
                }
            },
            render: function() {

                var mapRows = function(row, index) {
                    return ngReactGridBodyRow( {key:index, row:row, columns:this.props.columnDefs, grid:this.props.grid} )
                }.bind(this);

                var rows;

                if(!this.state.fullRender) {
                    rows = this.props.grid.data.slice(0, 100).map(mapRows);
                } else {
                    rows = this.props.grid.data.map(mapRows);
                }
                
                var ngReactGridViewPortStyle = {};

                if(!this.props.grid.horizontalScroll) {
                    ngReactGridViewPortStyle.overflowX = "hidden";
                }

                return (
                    React.DOM.div( {className:"ngReactGridBody"}, 
                        React.DOM.div( {className:"ngReactGridViewPort", style:ngReactGridViewPortStyle}, 
                            React.DOM.div( {className:"ngReactGridInnerViewPort"}, 
                                React.DOM.table(null, 
                                    React.DOM.tbody(null,  
                                        rows
                                    )
                                )
                            )
                        )
                    )
                );
            }
        });
    })();

    var ngReactGridFooter = (function() {
        return React.createClass({
            render: function() {
                return (
                    React.DOM.div( {className:"ngReactGridFooter"}, "-")
                );
            }
        });
    })();

    var ngReactGrid = React.createClass({displayName: 'ngReactGrid',
        render: function() {
            return (
                React.DOM.div( {className:"ngReactGrid"}, 
                    ngReactGridHeader( {grid:this.props.grid} ),
                    ngReactGridBody( {grid:this.props.grid} ),
                    ngReactGridFooter( {grid:this.props.grid} )
                )
            )
        }
    });

    return ngReactGrid;
})();