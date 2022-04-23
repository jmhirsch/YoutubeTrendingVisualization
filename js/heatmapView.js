class HeatmapView {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */

    types = {
        ViewCount: "Views",
        Likes: "Likes",
        Dislikes: "Dislikes",
        CommentCount: "Comments"
    }

    constructor(_config, _data, _type) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 1000,
            containerHeight: _config.containerHeight || 600,
            tooltipPadding: 15,
            margin: {top: 90, right: 50, bottom: 50, left: 80},
            legendWidth: 260,
            legendBarHeight: 15,
        }
        this.data = _data;
        this.type = _type
        this.counterDay = 0;
        this.counterTime = 0;
        this.slowDownTime = 0;
        this.first = true;
        this.initVis();
    }

    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;

        // Array to convert values to weekday name
        vis.weekday = new Array(7);
        vis.weekday[0] = "Monday";
        vis.weekday[1] = "Tuesday";
        vis.weekday[2] = "Wednesday";
        vis.weekday[3] = "Thursday";
        vis.weekday[4] = "Friday";
        vis.weekday[5] = "Saturday";
        vis.weekday[6] = "Sunday";

        // Calculate inner chart size.
        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.svg.on('mousemove', function (event, d) {
            d3.select('#tooltip')
                .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
                .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
        })


        // Append actual chart
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .on("wheel.zoom", (event, d) => {
                event.preventDefault()
                event.stopPropagation()
            });


        vis.chart = vis.chartArea.append('g')
            .on("wheel.zoom", (event, d) => {

                if (Math.abs(event.wheelDeltaY) > Math.abs(event.wheelDeltaX)) {

                    if (event.wheelDeltaY < -3) {
                        vis.counterTime -= 1
                        event.preventDefault()
                        event.stopPropagation()
                        vis.scrollVis()

                    } else if (event.wheelDeltaY > 3) {
                        vis.counterTime += 1;
                        event.preventDefault()
                        event.stopPropagation()
                        vis.scrollVis()

                    }
                }

                if (Math.abs(event.wheelDeltaY) < Math.abs(event.wheelDeltaX)) {

                    if (event.wheelDeltaX < -4) {

                        vis.slowDownTime -= 1;
                        if (vis.slowDownTime === -8) {
                            vis.slowDownTime = 0;
                            vis.counterDay -= 1
                            event.preventDefault()
                            event.stopPropagation()
                            vis.scrollVis()
                        }

                    } else if (event.wheelDeltaX > 4) {
                        vis.slowDownTime += 1;
                        if (vis.slowDownTime === 8) {
                            vis.slowDownTime = 0;
                            vis.counterDay += 1
                            event.preventDefault()
                            event.stopPropagation()
                            vis.scrollVis()
                        }
                    }
                }
            });

        // Initialize scales
        vis.colorScale = d3.scaleLinear()
            .range(['#edede9', '#a850ff']);

        vis.xScale = d3.scaleLinear()
            .domain([0, 7])
            .range([0, vis.config.width]);

        vis.yScale = d3.scaleBand()
            .domain([0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
                14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
            .range([0, vis.config.height])
            .paddingInner(0.2);

        // Initialize axis
        vis.xAxis = d3.axisTop(vis.xScale)
            .ticks(0)
            .tickSize(0)
            .tickFormat(d => vis.weekday[d])
            .tickSizeOuter(10)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(24)
            .tickFormat(d => (d + 1) + ':00')
            .tickSize(0);

        // Append empty axis groups
        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis x-axis heatmap');

        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis heatmap');

        // Add chart title

        //add title
        vis.title = vis.svg.append('g')
            .attr('class', 'heatmap title help-label')
            .on('mouseover', function (event, d) {
                vis.showTooltip(event, d)
            })
            .on('mouseleave', function (event, d) {
                vis.hideTooltip()
            })

        vis.title.append("text")
            .attr('class', 'heatmap title')
            .attr('y', 24)
            .attr('x', vis.config.containerWidth / 2 - 80)
            .attr("text-anchor", "middle")
            .text("YouTube Posting Day/Time Heatmap")

        vis.title.append('text')
            .attr('class', 'heatmap title circle')
            .attr('y', 23)
            .attr('x', vis.config.containerWidth / 2 + 107)
            .html('&#8413;')

        vis.title.append('text')
            .attr('class', 'heatmap title q')
            .attr('y', 23)
            .attr('x', vis.config.containerWidth / 2 + 98)
            .text('?')

        // Legend
        vis.legend = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.containerWidth - vis.config.legendWidth - vis.config.margin.right - 20},20)`);

        //from https://www.visualcinnamon.com/2016/05/smooth-color-legend-d3-svg-gradient/
        vis.legendColorGradient = vis.legend.append('defs').append('linearGradient')
            .attr('id', 'linear-gradient')

        vis.legendColorRamp = vis.legend.append('rect')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendBarHeight)
            .attr('fill', 'url(#linear-gradient)');

        vis.xLegendScale = d3.scaleLinear()
            .range([0, vis.config.legendWidth]);

        vis.xLegendAxis = d3.axisBottom(vis.xLegendScale)
            .tickSize(vis.config.legendBarHeight + 3)
            .tickFormat(d => formatCompact(d) + getFormatSize(d));

        vis.xLegendAxisG = vis.legend.append('g')
            .attr('class', 'axis x-axis legend-axis');

        // Navigation Buttons
        vis.buttons = vis.svg.append('g')
            .attr('class', 'heatmap button-group')
            .attr('transform', `translate(100,0)`);

        const up_btn = vis.buttons.append('rect')
            .attr('id', 'up-btn')
            .attr('class', 'h-btn up rect')
            .attr('width', '25px')
            .attr('height', '25px')
            .on('click', () => {
                vis.counterTime--;
                vis.scrollVis();
            })

        const up_btn_text = vis.buttons.append('text')
            .attr('id', 'up-btn-text')
            .attr('class', 'h up icon')
            .attr('x', 7)
            .attr('y', 59)
            .text('▲')
            .on('click', () => {
                vis.counterTime--;
                vis.scrollVis();
            })


        const down_btn = vis.buttons.append('rect')
            .attr('id', 'down-btn')
            .attr('class', 'h-btn down rect')
            .on('click', () => {
                vis.counterTime++;
                vis.scrollVis();
            })

        const down_btn_text = vis.buttons.append('text')
            .attr('class', 'h down icon')
            .attr('x', 39)
            .attr('y', 60)
            .text('▼')
            .on('click', () => {
                vis.counterTime++;
                vis.scrollVis();
            })

        const right_btn = vis.buttons.append('rect')
            .attr('id', 'right-btn')
            .attr('class', 'h-btn right rect')
            .on('click', () => {
                vis.counterDay++;
                vis.scrollVis();
            })

        const right_btn_text = vis.buttons.append('text')
            .attr('class', 'h right icon')
            .attr('x', 129)
            .attr('y', 59)
            .text('▶︎')
            .on('click', () => {
                vis.counterDay++;
                vis.scrollVis();
            })

        const left_btn = vis.buttons.append('rect')
            .attr('id', 'left-btn')
            .attr('class', 'h-btn left rect')
            .on('click', () => {
                vis.counterDay--;
                vis.scrollVis();
            })


        const left_btn_text = vis.buttons.append('text')
            .attr('id', 'left-btn-text')
            .attr('class', 'h left icon')
            .attr('x', 96)
            .attr('y', 59)
            .text('◀︎')
            .on('click', () => {
                vis.counterDay--;
                vis.scrollVis();
            })


        vis.addBtnListeners(up_btn, "#up-btn")
        vis.addBtnListeners(up_btn_text, "#up-btn")

        vis.addBtnListeners(down_btn, "#down-btn")
        vis.addBtnListeners(down_btn_text, "#down-btn")

        vis.addBtnListeners(left_btn, "#left-btn")
        vis.addBtnListeners(left_btn_text, "#left-btn")

        vis.addBtnListeners(right_btn, "#right-btn")
        vis.addBtnListeners(right_btn_text, "#right-btn")

    }

    // Prepare the data and scales before we render it
    updateVis() {
        const vis = this;

        vis.dumbyList = [];

        // Add published day and time variables; calculate max views
        vis.data.forEach(d => {
            d['PublishedDay'] = d.PublishedDate.getDay();
            d['PublishedTime'] = d.PublishedDate.getHours();
            d['DayTime'] = `${d['PublishedDay']}${d['PublishedTime']}`;

            let maxViews = 0;
            d['TrendingDatesFiltered'].forEach(d => {
                if (d[vis.type.default] > maxViews) {
                    maxViews = d[vis.type.default];
                }
            })
            d['TotalViews'] = maxViews;
        })

        vis.groupedData = d3.groups(vis.data, d => d['DayTime']);
        vis.groupedViewCount = d3.rollup(vis.data, v => d3.sum(v, d => d['TotalViews']), d => d['DayTime']);
        vis.groupedDay = d3.group(vis.data, d => d.PublishedDay);
        vis.groupedTime = d3.group(vis.data, d => d.PublishedTime);

        // Add 0 to Day/Times that don't have data
        for (let i = 0; i < 7; i++) {
            for (let m = 0; m < 24; m++) {
                let indexValue = `${i}${m}`;
                if (vis.groupedViewCount.get(indexValue) == undefined) {
                    vis.groupedViewCount.set(indexValue, 0);
                    vis.groupedData.set(indexValue, vis.dumbyList);
                }
            }
        }

        vis.groupedData.sort((a,b) => {
            return a[0] > b[0] ?  1 : a[0] < b[0] ?  -1:  0;
        })

        //console.log(vis.groupedData)

        vis.cellWidth = (vis.config.width / (vis.xScale.domain()[1] - vis.xScale.domain()[0])) - 5;

        // Specify accessor functions
        vis.day = d => d['PublishedDay'];
        vis.time = d => d['PublishedTime'];
        vis.views = d => d['TotalViews'];
        vis.colorValue = d => d['TotalViews'];
        vis.yValue = d => d[0];
        vis.totalViews = d => d[1];
        vis.timePull = d => d[0].toString().substr(1, 2);
        vis.dayPull = d => d[0].toString().substr(0, 1);

        // Set scale input domains
        vis.colorScale.domain(d3.extent(vis.groupedViewCount, vis.totalViews));

        vis.renderVis();
        vis.renderLegend();
        if (vis.first) {
            vis.first = false;
            vis.scrollVis();
        }
    }

    scrollVis() {
        let vis = this;

        vis.chart.selectAll('.cell')
            .attr('y', d => {
                let yValue = ((((+vis.timePull(d)) + vis.counterTime) % 24) + 24) % 24;
                return vis.yScale(yValue);
            }).attr('x', d => {
            let xValue = ((((+vis.dayPull(d)) + vis.counterDay) % 7) + 7) % 7;
            return vis.xScale(xValue);
        })

        vis.addTooltips();
        vis.renderAxis(vis);

    }

    addTooltips() {
        let vis = this;

        vis.chart.selectAll('.cell').on('mouseover', (event, d) => {
            const value = vis.groupedViewCount.get(d[0]);
            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                .html(`
              <div class='tooltip-title'>${vis.weekday[d[0].toString().substr(0, 1)]} @ 
                    ${Number(d[0].toString().substr(1, 2)).toFixed(0).padStart(2, '0') + ":00"}</div>
              <div>Total ${vis.types[vis.type.default]}: ~<b>${format(value)}</b></div>
            `);
        })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            })
    }

    renderAxis() {
        let vis = this;
        vis.chart.selectAll('.weekdays')
            .data(vis.groupedDay)
            .join('text')
            .attr('class', 'weekdays')
            .attr('x', d => {
                let xValue = ((((+vis.dayPull(d)) + vis.counterDay) % 7) + 7) % 7;
                return vis.xScale(xValue) + vis.cellWidth / 2;
            })
            .attr('y', -10)
            .style("font-size", "12px")
            .text(d => vis.weekday[d[0]]);

        vis.addTooltips();

        // Adding y-axis labels
        vis.chart.selectAll('.timeOfDay')
            .data(vis.groupedTime)
            .join('text')
            .attr('class', 'timeOfDay')
            .attr('y', d => {
                let yValue = ((((+d[0]) + vis.counterTime) % 24) + 24) % 24;
                return vis.yScale(yValue) + vis.yScale.bandwidth() / 8;
            })
            .attr('x', -8)
            .attr('text-anchor', 'end')
            .attr('dy', '0.85em')
            .style("font-size", "12px")
            .text(d => d[0] + ':00');

        vis.xAxisG.call(vis.xAxis)
            .call(g => g.select('.domain').remove());
        vis.yAxisG.call(vis.yAxis)
            .call(g => g.select('.domain').remove());
    }

    // Bind data to visual elements
    renderVis() {
        const vis = this;

        // Heatmap cells
        vis.cell = vis.chart.selectAll('.cell')
            .data(vis.groupedData)
            .join('rect')
            .attr('class', 'cell')
            .attr('height', vis.yScale.bandwidth())
            .attr('width', vis.cellWidth)
            .transition().duration(500)
            .attr('fill', d => {
                return vis.colorScale(vis.groupedViewCount.get(d[0]))
            })
    }

    // Update colour legend
    renderLegend() {
        const vis = this;

        // Add stops to gradient
        vis.legendColorGradient.selectAll('stop')
            .data(vis.colorScale.range())
            .join('stop')
            .attr('offset', (d, i) => i / (vis.colorScale.range().length - 1))
            .attr('stop-color', d => d);


        // Set x-scale
        vis.xLegendScale.domain(vis.colorScale.domain()).nice();
        const extent = vis.xLegendScale.domain();

        // Tick values
        vis.xLegendAxis.tickValues([
            extent[0],
            parseInt(extent[1] / 4),
            parseInt(extent[1] / 4 * 2),
            parseInt(extent[1] / 4 * 3),
            extent[1]
        ]);

        vis.legend.selectAll('.legend-title').transition().duration(500).attr('opacity', '0').remove()
        // Add legend title
        vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('dy', '0.35em')
            .attr('y', -8)
            .attr('opacity', '0')
            .style("font-size", "12px")
            .transition().duration(500)
            .attr('opacity', '1')
            .text('Number of ' + vis.types[vis.type.default]);

        // Update legend axis
        vis.xLegendAxisG.call(vis.xLegendAxis);
    }

    showTooltip(event, d) {
        let vis = this;
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class='tooltip-title'>
               Published Date Heatmap</div>
               <ul>
               <li>This heatmap displays the interactions for each day/time combination </li>
               <li>These will adjust based on the filters you select</li>
               <li>Hover over a cell to view more information</li>
               <li>You can use the buttons to adjust the times/days you are viewing</li>
               <li>Try scrolling the heatmap up/down (or event left/right)!</li>
                </ul>`)
    }

    hideTooltip() {
        d3.select('#tooltip').style('display', 'none')
    }

    addBtnListeners(element, btn_id) {
        const vis = this;

        element.on('mousedown', function (event, d) {
            let btn = d3.select(btn_id);
            btn.style('fill', d3.color(btn.style('fill')).darker());
        })
            .on('mouseup', function (event, d) {
                let btn = d3.select(btn_id);
                btn.style('fill', d3.color(btn.style('fill')).brighter());
            })
            .on('mouseover', function (event, d) {
                let btn = d3.select(btn_id);
                btn.style('stroke-width', '1px');
            })
            .on('mouseleave', function (event, d) {
                let btn = d3.select(btn_id);
                btn.style('stroke-width', '0.5px');
            })
    }
}