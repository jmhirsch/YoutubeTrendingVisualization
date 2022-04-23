class MapView {


    types = {
        NormalizedViewCount: "Views per million people",
        NormalizedLikes: "Likes per million people",
        NormalizedDislikes: "Dislikes per million people",
        NormalizedCommentCount: "Comments per million people"
    }

    typesLegend = {
        NormalizedViewCount: "Views per million people",
        NormalizedLikes: "Likes per million people",
        NormalizedDislikes: "Dislikes per million people",
        NormalizedCommentCount: "Comments per million people"
    }

    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _dispatcher, _geoData, _countryData, _data, _type) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 700,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || { top: 0, right: 0, bottom: 0, left: 0 },
            tooltipPadding: 10
        }
        this.geoData = _geoData;
        this.countryData = _countryData;
        this.data = _data;
        this.type = _type;
        this.dispatcher = _dispatcher;
        this.selectedCountry = 'all';
        this.initVis();
        this.first = true;
    }

    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            

        // Append group element that will contain our actual chart 
        // and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
        

        vis.title = d3.select(vis.config.parentElement).append('g')
            .attr('class', 'map title help-label')
            .on('mouseover', function (event, d) {
                vis.showTooltip(event, d)
            })
            .on('mouseleave', function (event, d) {
                vis.hideTooltip()
            })

        vis.title.on('mousemove', function (event, d) {
            d3.select('#tooltip')
                .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
                .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
        })

        vis.title.append("text")
            .attr('class', 'map title')
            .attr("text-anchor", "middle")
            .text("Map")

        vis.title.append('text')
            .attr('class', 'map title circle')
            .html('&#8413;')

        vis.title.append('text')
            .attr('class', 'map title q')
            .text('?')

        // Defines the scale and translate of the projection so that the geometry fits within the SVG area
        // We crop Antartica because it takes up a lot of space that is not needed for our data
        vis.projection = d3.geoEquirectangular()
            .center([0, 15]) // set centre to further North
            .scale([vis.width / (2 * Math.PI)]) // scale to fit size of svg group
            .translate([vis.width / 2, vis.height / 2]); // ensure centered within svg group

        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.symbolScale = d3.scaleSqrt()
            .range([7, 30]);

        vis.chart.append('rect')
            .attr('id', 'clickable-rect')
            .attr('x', '0')
            .attr('y', '0')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .on('click', function (event, d) {
                vis.svg.selectAll('.geo-symbol').style('opacity', .9)
                vis.svg.selectAll('.geo-label').style('opacity', 1)
                vis.dispatcher.call('country_selected', event, 'all')
            });

        vis.legendText = vis.chart.append('text')
            .attr('class', 'map-legend-text')
            .attr('y', vis.height - 130)
            .attr('x', 80)
            .text('Views per 1M people')
            .attr('text-anchor', 'middle')
            .style('stroke', '#cbcbcb')
            .style('stroke-width', '0.5px')
            .attr('font-size', '12px')

        vis.chart.append('circle')
            .attr('id', 'legendSmallCircle')
            .attr('cx', '50')
            .attr('cy', vis.height - 80 + 23)
            .attr('opacity', 0.9)
            .attr('r', 7)

        vis.chart.append('circle')
            .attr('id', 'legendMediumCircle')
            .attr('cx', '50')
            .attr('cy', vis.height - 80 + 12)
            .attr('opacity', 0.6)
            .attr('r', 18)

        vis.chart.append('circle')
            .attr('id', 'legendLargeCircle')
            .attr('cx', '50')
            .attr('cy', vis.height - 80)
            .attr('opacity', 0.3)
            .attr('r', 30)
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let countryCounts = { 'us': 0, 'mx': 0, 'br': 0, 'fr': 0, 'de': 0, 'ru': 0, 'in': 0, 'jp': 0, 'kr': 0 };

        // Compute total value to be displayed for each country
        vis.data.forEach(function (d) {
            let countryMax;
            // For each unique video, group the trending dates array by country
            d.countryList = d3.group(d.TrendingDatesFiltered, i => i.Country);
            // For each country array within each unique video, find and store the maximum [view] count
            d.countryList.forEach(function (j) {
                countryMax = j[0][vis.type.norm];
                j.forEach(function (k) {
                    if (k[vis.type.norm] > countryMax) {
                        countryMax = k[vis.type.norm];
                    }
                })
                countryCounts[j[0].Country] += countryMax;
            })
        });

        // Add country counts computed above to countryData
        vis.countryData.forEach(
            d => d.size = countryCounts[d.countryCode]
        );

        vis.symbolScale.domain(d3.extent(vis.countryData, d => d.size));

        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        // Append world map
        const geoPath = vis.chart.selectAll('.geo-path')
            .data(topojson.feature(vis.geoData, vis.geoData.objects.countries).features)
            .join('path')
            .attr('class', 'geo-path')
            .attr('d', vis.geoPath);

        // Append country borders
        const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
            .data([topojson.mesh(vis.geoData, vis.geoData.objects.countries)])
            .join('path')
            .attr('class', 'geo-boundary-path')
            .attr('d', vis.geoPath);

        // Append symbols
        const geoSymbols = vis.chart.selectAll('.geo-symbol')
            .data(vis.countryData)
            .join('circle')
            .attr('class', 'geo-symbol')
            .attr('cx', d => vis.projection([d.lon, d.lat])[0])
            .attr('cy', d => vis.projection([d.lon, d.lat])[1]);

        geoSymbols.transition().duration(500).attr('r', d => d.size === 0 ? 5 : vis.symbolScale(d.size))

        // Tooltip event listeners
        geoSymbols
            .on('click', function (event, d) {
                if (vis.selectedCountry == d.countryCode)
                    vis.dispatcher.call('country_selected', null, 'all');
                else
                    vis.dispatcher.call('country_selected', null, d.countryCode);
            })
            .on('mousemove', (event, d) => {
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
                    .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
                    .html(`
              <div class="tooltip-title">${d.countryName}</div>
              <div>Population: ${parseInt(d.population).toLocaleString('en-US')}&nbsp;</div>
              <div>${vis.types[vis.type.norm]}: <strong>${format(parseInt(d.size))}</strong>&nbsp;</div>
            `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        // Append text labels to show the titles of all sights
        const geoSymbolLabels = vis.chart.selectAll('.geo-label')
            .data(vis.countryData)
            .join('text')
            .attr('class', 'geo-label')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('x', d => vis.projection([d.lon, d.lat])[0])
            .text(d => d.countryName);

        geoSymbolLabels.transition().duration(500).attr('y', d => (vis.projection([d.lon, d.lat])[1] - vis.symbolScale(d.size) - 8))

        vis.annotations = [{
            note: {
                label: format(vis.symbolScale.invert(30)),
                orientation: "leftRight",
                align: "middle",
                lineType: "dashed-array"
            },
            dx: 50,
            data: {xVal: 50, yVal: vis.height - 110},
            className: "map-annotation",
            type: d3.annotationCalloutElbow,
            color: "#663ae3"
        },
            {
                note: {
                    label: format(vis.symbolScale.invert(18)),
                    orientation: "leftRight",
                    align: "middle",
                    lineType: "dashed-array"
                },
                dx: 54,
                data: {xVal: 50, yVal: vis.height -86},
                className: "map-annotation",
                type: d3.annotationCalloutElbow,
                color: "#663ae3"
            },
            {
                note: {
                    label: format(vis.symbolScale.invert(7)),
                    orientation: "leftRight",
                    align: "middle",
                    lineType: "dashed-array"
                },
                dx: 56,
                data: {xVal: 50, yVal: vis.height -64},
                className: "map-annotation",
                type: d3.annotationCalloutElbow,
                color: "#663ae3"
            }
        ]


        vis.makeAnnotations = d3.annotation()
            .type(d => d.type)
            .accessors({
                x: d=>d.xVal,
                y: d=>d.yVal
            })
            .annotations(vis.annotations)
            .textWrap(90);

        d3.selectAll('.map-annotation').transition().duration(250).attr('opacity', '0')
        const legendText = vis.types[vis.type.norm]
        if (vis.first){
            vis.first = false;
        }else if (!vis.first) {
            if (legendText !== vis.legendText.text()) {
                vis.legendText.transition().duration(250).attr('opacity', 0)
            }
            setTimeout(() => d3.selectAll('.map-annotation')?.remove(), 200)
        }

        vis.annotationG = vis.chart.append("g")
            .attr("class", "annotation-group-map")
            .style("font-size", "12px")
        setTimeout( () => {
            vis.annotationG.call(vis.makeAnnotations)
            if (legendText !== vis.legendText.text()) {
                vis.legendText.text(`${vis.types[vis.type.norm]}`)
                vis.legendText.transition().duration(250).attr('opacity', 1)
            }
            d3.selectAll('.map-annotation').attr('opacity', '0')
            d3.selectAll('.map-annotation').transition().duration(250).attr('opacity', 1)
        }, 251)

    }

    updateSelection(_country) {
        let vis = this;
        if (_country == 'all') {
            vis.svg.selectAll('.geo-symbol').style('opacity', .9)
            vis.svg.selectAll('.geo-label').style('opacity', 1)
        } else {
            let bubbles = vis.svg.selectAll('.geo-symbol');
            let labels = vis.svg.selectAll('.geo-label')

            bubbles.style('opacity', .2)
            labels.style('opacity', .5)

            bubbles._groups[0].forEach(function (d) {
                if (d.__data__.countryCode == _country) {
                    d3.select(d).style('opacity', .9);
                }
            })

            labels._groups[0].forEach(function (d) {
                if (d.__data__.countryCode == _country) {
                    d3.select(d).style('opacity', 1);
                }
            })
        }
        vis.selectedCountry = _country;
    }

    showTooltip(event, d) {
        let vis = this;
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class='tooltip-title'>
               Country Map</div>
               <ul>
               <li>Each circle represents a country in the dataset</li>
               <li>The circle is sized according to the filters you select</li>
               <li>Click on a country to select it</li>
               <li>Click on it again, or anywhere on the map, to unselect it</li>
                </ul>`)
    }

    hideTooltip() {
        d3.select('#tooltip').style('display', 'none')
    }
}