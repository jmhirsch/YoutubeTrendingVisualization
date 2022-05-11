class BubblesView {

    draggedBubble = null

    types = {
        ViewCount: "Views",
        Likes: "Likes",
        Dislikes: "Dislikes",
        CommentCount: "Comments"
    }

    constructor(_config, _dispatcher, _categories, _data, _type) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 300,
            containerHeight: _config.containerHeight || 600,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            tooltipPadding: 10
        };
        this.categories = _categories
        this.data = _data;
        this.forceStrength = 0.07;
        this.initVis();
        this.selectedCategory = 0
        this.dispatcher = _dispatcher;
        this.type = type;
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.svg.attr('overflow', 'visible')

        //add title
        vis.title = vis.svg.append('g')
            .attr('class', 'bubbles title help-label')
            .on('mouseover', function (event, d) {
                vis.showTooltip(event, d)
            })
            .on('mouseleave', function (event, d) {
                vis.hideTooltip()
            })
        
        vis.title.append("text")
            .attr('class', 'bubbles title')
            .attr("x", vis.width / 2)
            .attr("y", -47)
            .attr("text-anchor", "middle")
            .text("Categories")

        vis.title.append('text')
            .attr('class', 'bubbles title circle')
            .attr('x', vis.width / 2 + 70)
            .attr('y', -49)
            .html('&#8413;')

        vis.title.append('text')
            .attr('class', 'bubbles title q')
            .attr('x', vis.width / 2 - 9 + 70)
            .attr('y', -49)
            .text('?')

        vis.centre = {x: vis.width / 2, y: vis.height / 2};

        vis.radiusScale = d3.scaleSqrt()
            .range([25, 80])


        vis.fillColour = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([1, 44])
            .range(["#dbc9ff", "#5bd594", "#fe98b2", "#fec7f8",
                "#10b0ff", "#9988df", "#1da49c", "#bbd9fd",
                "#8bbaf4", "#6191ab", "#ffa822",
                "#6e83c8", "#ffafa9", "#0095f7", "#ffcc80"]);


        vis.simulation = d3.forceSimulation()
            .force('charge', d3.forceManyBody().strength(d => (d.radius) * 2))
            .force('x', d3.forceX().strength(vis.forceStrength).x(vis.centre.x))
            .force('y', d3.forceY().strength(vis.forceStrength).y(vis.centre.y))
            .force('collision', d3.forceCollide().radius(d => d.radius + 2));
    }

    updateVis() {
        let vis = this;

        vis.group = d3.group(vis.data, d => d.CategoryID);

        vis.filteredData = d3.rollups(vis.data, v => d3.sum(v, d => d[this.type.max]), d => d.CategoryID);
        vis.radiusScale.domain(d3.extent(vis.filteredData, d => d[1]))

        vis.nodes = vis.filteredData.map(d => ({
            ...d,
            radius: vis.radiusScale(d[1]),
            x: vis.centre.x,
            y: vis.centre.y,
            category: vis.categories.find(c => c.id === d[0]).title,
            data: d[1],
            videoCount: vis.group.get(d[0]).length
        }))

        vis.renderVis()
    }

    renderVis() {
        let vis = this;

        // need to change data that is passed
        vis.bubbles = vis.svg.selectAll('.bubble')
            .data(vis.nodes)
            .join('circle')
            .attr('class', 'bubble')
            .attr('r', d => d.radius)
            .attr('stroke', 'black')
            .attr('id', d => d[0])
            .attr('selected', false)
            .attr('fill', d => vis.fillColour(d[0]))


        vis.addEvents()

        vis.labels = vis.svg.selectAll('.bubble-text')
            .data(vis.nodes)
            .join('text')
            .attr('dy', '.3em')
            .attr('class', 'bubble-text')
            .style('text-anchor', 'middle')
            .style('font-size', 12)
            .attr('opacity', d => vis.getOpacity(d, vis.selectedCategory, true))
            .text(d => vis.getTitle(d[0]));

        vis.simulation.restart()
        vis.simulation.alpha(1)
        vis.simulation.nodes(vis.nodes);
        vis.simulation.on('tick', d => vis.tick(d));
    }


    addEvents() {
        let vis = this;
        vis.svg.on('mousemove', function (event, d) {
            d3.select('#tooltip')
                .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
                .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
        })

        vis.bubbles.on('mouseover', function (event, d) {
            let bubble = d3.select(this);
            bubble.style('stroke-width', '2px')

            let formattedData = format(d.data)

            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                .html(`
              <div class='tooltip-title'>
               ${d.category} -- #${d[0]}</div>
               <div>Total ${vis.types[vis.type.default]}: ~<strong>${formattedData}</strong></div>`);
        })
            
            .on('mouseleave', function (event, d) {
                let bubble = d3.select(this);

                if (+d[0] === +vis.selectedCategory){
                    bubble.style('stroke-width', '1px')
                }else{
                    bubble.style('stroke-width', '0')
                }

                d3.select('#tooltip').style('display', 'none');
                if (!bubble.classed('dragged')) {
                    bubble.attr('fill', d => vis.fillColour(d[0]))
                }
            })
            .on('mousedown', function (event, d) {
                event.preventDefault()
                let bubble = d3.select(this);
                bubble.attr('fill', d3.color(bubble.attr('fill')).darker())
            })
            .on('click', function (event, d) {
                if (event.defaultPrevented) return;
                let bubble = d3.select(this);
                vis.svg.selectAll('.bubble').style('stroke-width', '0');
                bubble.style('stroke-width', '2px')
                if (+d[0] === +vis.selectedCategory) {
                    vis.selectedCategory = 0
                    vis.dispatcher.call('category_selected', null, 0)

                } else {
                    vis.selectedCategory = +d[0]
                    vis.dispatcher.call('category_selected', null, +d[0])
                }
            })
            .call(d3.drag()
                .on("start", (event, d) => vis.dragstarted(event, d))
                .on("drag", (event, d) => vis.dragged(event, d))
                .on("end", (event, d) => vis.dragended(event, d)));
    }

    updateStroke(){
        let vis = this;
        vis.svg.selectAll('.bubble').transition().duration(500).style('stroke-width', d=>+d[0] === vis.selectedCategory? '1px': '0');
    }

    rerender() {
        let vis = this;
        vis.group = d3.group(vis.data, d => d.CategoryID);
        vis.filteredData = d3.rollups(vis.data, v => d3.sum(v, d => d[this.type.max]), d => d.CategoryID);
        vis.radiusScale.domain(d3.extent(vis.filteredData, d => d[1]))

        let newNodes = []

        for (let node of vis.nodes) {
            node.old_radius = node.radius
            let newVal = vis.filteredData.find(e => +e[0] === +node[0]);
            node.radius = vis.radiusScale(newVal[1]);
            node.data = newVal[1];
            node.videoCount = vis.group.get(newVal[0]).length
            newNodes.push(node)
        }

        vis.bubbles = vis.svg.selectAll('.bubble')
            .data(newNodes)
            .join('circle')
            .attr('class', 'bubble')
            .attr('r', d => d.old_radius)
            .attr('stroke', 'black')
            .attr('id', d => d[0])
            .attr('selected', d=>+d[0] === vis.selectedCategory)
            .attr('fill', d => vis.fillColour(d[0]))


        vis.labels = vis.svg.selectAll('.bubble-text')
            .data(newNodes)
            .join('text')
            .attr('dy', '.3em')
            .attr('class', 'bubble-text')
            .style('text-anchor', 'middle')
            .style('font-size', 12)
            .text(d => vis.getTitle(d[0]))
            .attr('opacity', d => vis.getOpacity(d, vis.selectedCategory, true))

        vis.addEvents()

        vis.simulation = d3.forceSimulation()
            .force('charge', d3.forceManyBody().strength(d => (d.radius + 2)))
            .force('x', d3.forceX().strength(vis.forceStrength).x(vis.centre.x))
            .force('y', d3.forceY().strength(vis.forceStrength).y(vis.centre.y))
            .force('collision', d3.forceCollide().radius(d => d.radius + 2));
        vis.simulation.nodes(vis.nodes);
        vis.simulation.alpha(0.8);
        vis.simulation.alphaTarget(0)

        vis.bubbles.transition().duration(750).attr('r', d => d.radius);

        vis.simulation.on('tick', d => vis.tick(d));
        vis.simulation.restart()
    }

    updateSelection(_category) {
        let vis = this;
        _category = +_category;
        if (_category === 0) {
            vis.svg.selectAll('.bubble').transition(800).style('opacity', .98)
            vis.svg.selectAll('.bubble-text').style('opacity', b => vis.getOpacity(b, _category, true))

        } else {
            vis.svg.selectAll('.bubble').transition(500).style('opacity', b => vis.getOpacity(b, _category))
            vis.svg.selectAll('.bubble-text').style('opacity', b => vis.getOpacity(b, _category, true))
        }
        vis.selectedCategory = _category;
    }

    getOpacity(b, cagegory, isTitle = false) {
        let vis = this;
        if (isTitle && !vis.shouldDisplayCategory(b.radius, vis.getTitle(b[0]))) {
            return 0;
        }
        if (+category !== 0 && +b[0] !== +cagegory) {
            return .2;
        }
        return isTitle ? 1 : .98;
    }

    getTitle(id) {
        const vis = this;
        for (let category of vis.categories) {
            if (+category.id === +id) {
                return category.title
            }
        }
    }

    shouldDisplayCategory(r, text) {
        return r * 2 + 3 > this.get_tex_width(text, "13px Nunito");
    }

    get_tex_width(txt, font) {
        this.element = document.createElement('canvas');
        this.context = this.element.getContext("2d");
        this.context.font = font;
        return this.context.measureText(txt).width;
    }


    tick() {
        let vis = this
        vis.bubbles
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)

        vis.labels
            .attr('x', d => d.x)
            .attr('y', d => d.y)
    }

    dragstarted(event, d) {
        let vis = this;
        event.sourceEvent.stopPropagation();
        let bubble = d3.select(event.sourceEvent.srcElement);
        bubble.classed('dragged', true)
        vis.draggedBubble = bubble;
        if (!event.active) vis.simulation.alphaTarget(0.5).restart()
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragended(event, d) {
        let vis = this;
        if (!event.active) vis.simulation.alphaTarget(0);
        let bubble = d3.select(event.sourceEvent.srcElement);
        if (bubble !== vis.draggedBubble && vis.draggedBubble !== null) {
            bubble = this.draggedBubble;
        }
        vis.draggedBubble = null
        bubble.attr('fill', vis.fillColour(d[0]))
        bubble.classed('dragged', false)
        d.fx = null;
        d.fy = null;
    }

    showTooltip(event, d){
        let vis = this;
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class='tooltip-title'>
               Category Bubbles</div>
               <ul>
               <li>Click on a bubble to select a video category</li>
               <li>Click on the bubble again to deselect it</li>
               <li>You can also select a category from the dropdown</li>
               <li>The bubbles are sized according to the filters you select</li>
               <li>Try dragging the bubbles!</li>
                </ul>`)
    }
    
    hideTooltip(){
        d3.select('#tooltip').style('display', 'none')
    }

}