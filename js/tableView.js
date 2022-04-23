class TableView {
    headers = ["Ranking", "Video Title", "Views"];
    first = true;
    types = {
        maxViews: "Views",
        maxLikes: "Likes",
        maxDislikes: "Dislikes",
        maxComments: "Comments"
    }
    
    countryNames = {
        "us": "United States",
        "gb": "United Kingdom",
        "fr": "France",
        "de": "Germany",
        "ru": "Russia",
        "ca": "Canada",
        "mx": "Mexico",
        "jp": "Japan",
        "kr": "South Korea",
        "in": "India",
        "br": "Brazil",
    }

    constructor(_config, _data, _type) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 10, right: 10, bottom: 10, left: -10},
            tooltipPadding: 10
        };
        this.data = _data;
        this.updateType(_type)
        this.initVis();
    }

    currType() {
        return this.types[this.type.max]
    }

    currTypeKey() {
        return this.type.max
    }

    updateType(_type) {
        this.type = _type
        this.headers[2] = this.currType();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;




        vis.svg = d3.select(vis.config.parentElement).append("g")
            .attr("width", vis.width)
            .attr("height", vis.height);
        vis.svg.on('mousemove', function (event, d) {
            d3.select('#tooltip')
                .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
                .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
        })


        //add title
        vis.title = vis.svg.append('g')
            .attr('class', 'table title help-label')
            .attr('top', '100px')
            .on('mouseover', function (event, d) {
                vis.showTooltip(event, d)
            })
            .on('mouseleave', function (event, d) {
                vis.hideTooltip()
            })

        vis.tableArea = vis.svg.append('g')

        vis.title.append("text")
            .attr("text-anchor", "middle")
            .text("Most Popular Videos")

        vis.title.append('text')
            .attr('class', 'table title circle')
            .html('&#8413;')

        vis.title.append('text')
            .attr('class', 'table title q')
            .text('?')

        vis.table = vis.tableArea.append("table")
            .attr('class', 'table');

        vis.thead = vis.table.append("thead")
            .attr('class', 'table-head');
        vis.tbody = vis.table.append("tbody")
            .attr('class', 'table-body')

        vis.thead.append("tr")
            .selectAll(".row-header")
            .data(vis.headers)
            .join("th")
            .attr('class', 'row-header')
            .text(function (column) {
                return column;
            });


        vis.selectedCat = 'all'
        vis.timeframe = 'all'
        vis.dataType = 'all'
    }

    updateVis() {
        let vis = this;

        if (!vis.first) {
            vis.thead.transition().duration(250).selectAll(".row-header").style('opacity', '0')
            vis.tbody.transition().duration(250).selectAll(".row").style('opacity', '0')
            setTimeout(function () {
                vis.renderVis()
            }, 250)
        }


        vis.top10data = vis.data.sort((a, b) => {
            return d3.descending(+a[vis.currTypeKey()], +b[vis.currTypeKey()])
        }).slice(0, 10);

        vis.tableData = [];


        vis.top10data.forEach((d, index) => {
            let item = {
                "Ranking": index,
                "Video Title": d.VideoTitle,
                "Channel": d.ChannelName,
                "Views": d.maxViews,
                "Category": d.CategoryName,
                "Likes": d.maxLikes,
                "Dislikes": d.maxDislikes,
                "Comments": d.maxComments,
                "Published": d.PublishedDate,
                "Trending From": d3.min(d.TrendingDates, t => t.TrendingDate),
                "Trending To": d3.max(d.TrendingDates, t => t.TrendingDate),
                "Trending Countries": [...new Set(d.TrendingDates.map(t => t.Country))].map(c => vis.countryNames[c]).join(', '),
                //Convert duration to minutes and seconds
                "Duration": Math.floor((d.Duration / 1000 / 60)).toFixed(0).padStart(2, '0') + ":" + (d.Duration / 1000 % 60).toFixed(0).padStart(2, '0')
            };
            //item[vis.currType()] = thouSeparator(d[vis.currTypeKey()])
            vis.tableData.push(item)
        });

        if (vis.first) {
            vis.first = false;
            vis.renderVis()
        }
    }

    renderVis() {
        let vis = this;
        const divs = document.getElementsByClassName('row-div')
        for (let i = 0; i < divs.length; i++) {
            divs[i].style.maxHeight = "0px"
        }

        vis.thead.selectAll(".row-header")
            .data(vis.headers)
            .join("th")
            .style('opacity', '0')
            .attr('class', 'row-header')
            .text(function (column) {
                return column;
            });

        vis.rows = vis.tbody.selectAll(".row")
            .data(vis.tableData)
            .join(
                function (enter) {
                    return enter
                        .append('tr')
                        .attr('class', function (_, index) {
                            return index % 2 === 0 ? "row row-even activeRow" : "row row-odd activeRow";
                        })
                },
                function (update) {
                    return update;
                },
                function (exit) {
                    return exit
                        .attr('class', function (_, index) {
                            return index % 2 === 0 ? "row row-even" : "row row-odd";
                        })
                        .remove();
                }
            ).style('opacity', '0')
            .on('mouseover', function (event, d) {
                let dislikes = vis.getNum(d.Dislikes);
                let likes = vis.getNum(d.Likes);
                let views = vis.getNum(d.Views);
                let comments = vis.getNum(d.Comments)
                let duration = d.Duration;
                if (duration === '00:00'){
                    duration = "No Info"
                }
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
              <div class='tooltip-title'>
               # ${d.Ranking+1} - Channel: ${d.Channel}</div>
               <div>Published: <strong>${new Date(d.Published).toDateString()}</strong></div>
               <div>Trending From <strong>${new Date(d["Trending From"]).toDateString()}</strong> To <strong>${new Date(d["Trending To"]).toDateString()}</strong></div>
               <div>Trending in: <strong>${d["Trending Countries"]}</strong></div>
               <div>Category: <strong>${d.Category}</strong></div>
               <div><hr></div>
               <div>Length: <strong>${duration}</strong></div>
               <div>Views: <strong>${views}</strong></div>
               <div>Likes: <strong>${likes}</strong></div>
               <div>Dislikes: <strong>${dislikes}</strong></div>
               <div>Comments: <strong>${comments}</strong></div>`);
            })
            .on('mouseleave', function (event, d) {
                d3.select('#tooltip').style('display', 'none');
            });

        // create a cell in each row for each column
        vis.cells = vis.rows.selectAll(".table-cell")
            .data(function (row, index) {
                return vis.headers.map(function (column) {
                    return {column: index, value: column === "Ranking" ? index + 1 : row[column]};
                });
            })
            .join("td")
            .attr('class', function (_, index) {
                return index === 0 ? "table-cell cell-ranking" : index === 1 ? "table-cell cell-title" : "table-cell cell-num";
            })
            .html(d => `<div class="row-div">${isNaN(d.value)? d.value: thouSeparator(d.value)}</div>`)


        for (let i = 0; i < divs.length; i++) {
            divs[i].style.maxHeight = "100px"
        }

        vis.cells.transition(500)


        vis.rows.transition().duration(240).style('opacity', '1')
        vis.thead.transition().duration(250).selectAll(".row-header").style('opacity', '1')
    }

    getNum(num){
        if (isNaN(+num) && isNaN(num)){
            num = "No Data";
        }else{
            num = format(num)
        }
        return num;
    }

    showTooltip(event, d){
        let vis = this;
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class='tooltip-title'>
               Top 10 Videos</div>
               <ul>
               <li>Lists the most popular videos based on your category, country and time selection</li>
               <li>The videos are ranked by Views, Likes, Dislikes, or Comments</li>
               <li>Try hovering a video!</li>
                </ul>`)
    }

    hideTooltip(){
        d3.select('#tooltip').style('display', 'none')
    }
}