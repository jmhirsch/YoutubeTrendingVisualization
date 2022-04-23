class TimelineView {

    oldrange = "all"

    constructor(_config, _data, _dispatcher, _type) {

        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1400,
            containerHeight: 80,
            margin: {top: 10, right: 50, bottom: 25, left: 50},
        }
        this.data = _data;
        this.dispatcher = _dispatcher
        this.updates = true;
        this.type = _type
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Initialize scales
        vis.xScaleContext = d3.scaleTime()
            .range([0, vis.config.width]);


        vis.yScaleContext = d3.scaleSqrt()
            .range([vis.config.height, 0])
            .nice();

        // Initialize axes
        vis.xAxisContext = d3.axisBottom(vis.xScaleContext).tickSizeOuter(0)
            .ticks(d3.timeMonth.every(2))

        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement).append("svg")
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        
        vis.grad = vis.svg.append("defs").append("linearGradient")
            .attr('id', 'header-shape-gradient')
            .attr('gradientTransform', 'rotate(90)')
            
        vis.grad.append('stop')
            .attr('offset', '0%').attr('stop-color', 'var(--color-stop)');
        
        vis.grad.append('stop').attr('offset', '100%').attr('stop-color', 'var(--color-bot)');

        // Append context group with x- and y-axes
        vis.context = vis.svg
            .append("g")
            .attr(
                "transform",
                `translate(${vis.config.margin.left},${vis.config.margin.top})`
            );

        vis.contextAreaPath = vis.context
            .append("path")
            .attr("class", "chart-area");

        vis.xAxisContextG = vis.context
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.config.height})`);

        vis.brushG = vis.context.append("g").attr("class", "brush x-brush");

        vis.brush = d3
            .brushX()
            .extent([
                [0, 0],
                [vis.config.width, vis.config.height]
            ])
            .on("brush", function ({selection}) {
                //if (selection) vis.brushed(selection);
            })
            .on("end", function ({selection}) {
                if (selection) vis.brushed(selection);
                if (!selection) vis.brushed(null);
            });

        d3.select('.annotation.no-dislikes')
            .style('opacity', 0);

        vis.annotations = [{
            note: {
                label: "Youtube removed dislike data from videos on 2021-12-13",
                orientation: "leftRight",
                align: "middle",
                lineType: "none"
            },
            dy: -28,
            dx: -60,
            data: {Date: "2022-01-03", yVal: vis.config.height / 2 + 25},
            subject: {
                radius: 20,
                radiusPadding: 5
            },
            className: "no-dislikes",
            type: d3.annotationCalloutCircle,
            color: "#663ae3"
        }]


        vis.makeAnnotations = d3.annotation()
            .type(d => d.type)
            .accessors({
                x: d => vis.xScaleContext(new Date(d.Date)),
                y: d => d.yVal
            })
            .annotations(vis.annotations)
            .textWrap(450);

        vis.annotationG = vis.svg.append("g")
            .attr("class", "annotation-group")
            .style("font-size", "12px")


    }

    updateVis() {
        let vis = this;


        vis.xValue = (d) => d[0];
        vis.yValue = (d) => d[1];


        vis.rerender();
        vis.renderVis();
    }

    rerender() {
        let vis = this;

        vis.groupedData = d3.rollups(vis.data, v => d3.sum(v, d => d[this.type.default]), d => d.TrendingDate.getTime());

        vis.groupedData = vis.groupedData.sort((a, b) => {
            if (a[0] < b[0]) {
                return -1;
            }
            if (a[0] > b[0]) {
                return 1;
            }
            return 0
        })

        vis.xScaleContext.domain(d3.extent(vis.groupedData, vis.xValue));
        vis.yScaleContext.domain(d3.extent(vis.groupedData, vis.yValue));

        vis.area = d3.area()
            .x((d) => vis.xScaleContext(vis.xValue(d)))
            .y1((d) => vis.yScaleContext(vis.yValue(d)))
            .y0(vis.config.height);

        vis.bisectDate = d3.bisector(vis.xValue).left;

        vis.contextAreaPath
            .datum(vis.groupedData)
            .transition().duration(500)
            .attr("d", vis.area);

        if (vis.type.default === 'Dislikes') {
            d3.select('.annotation.no-dislikes').style('opacity', '1')
        } else {
            d3.select('.annotation.no-dislikes').style('opacity', '0')
        }
    }

    renderVis() {
        let vis = this;
        vis.pauseUpdates();


        vis.xAxisContextG.call(vis.xAxisContext);

        // Update the brush and define a default position
        const defaultBrushSelection = [
            vis.xScaleContext(d3.min(vis.groupedData, vis.xValue)) + 200,
            vis.xScaleContext.range()[1] - 200
        ];


        vis.brushG
            .call(vis.brush)
            .call(vis.brush.move, defaultBrushSelection);

        vis.annotationG.call(vis.makeAnnotations);
        vis.resumeUpdates();

        vis.brushed(defaultBrushSelection);
    }


    pauseUpdates() {
        this.updates = false;
    }

    resumeUpdates() {
        this.updates = true;
    }

    brushed(selection) {
        let vis = this;

        if (!vis.updates) {
            return;
        }

        // Check if the brush is still active or if it has been removed
        if (selection) {
            const selectedRange = selection.map(
                vis.xScaleContext.invert,
                vis.xScaleContext
            );

            vis.oldrange = "some"
            vis.dispatcher.call('time', null, selectedRange)


        } else {
            if (vis.oldrange !== 'all') {
                vis.dispatcher.call('time', null, d3.extent(vis.groupedData, vis.xValue))
                vis.oldrange = "all";
            }
        }

    }
}