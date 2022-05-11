/**
 * Load TopoJSON data of the world and the country location data
 */

let datasetloc ='data/smalldata.json'
// let datasetloc = 'data/fullsizedata.json'

let category = 0
let timerange = [] // all

let country = 'all'
let dataset, categories, mapView, bubbleView, tableView, heatmapView, timelineView;
let filteredData;
let trendingDates = []
let thouSeparator = d3.format(",.0f")
let decFormat = d3.format(",.3f")

let type0 = {max: 'maxViews', norm: 'NormalizedViewCount', default: 'ViewCount'}
let type1 = {max: 'maxLikes', norm: 'NormalizedLikes', default: 'Likes'}
let type2 = {max: 'maxDislikes', norm: 'NormalizedDislikes', default: 'Dislikes'}
let type3 = {max: 'maxComments', norm: 'NormalizedCommentCount', default: 'CommentCount'}
let type = type0

isCalculating = false;

window.onscroll = function () {
    scrollFunction()
};

function scrollFunction() {
    const scrollTop = document.documentElement.scrollTop
    if (scrollTop > 80) {
        document.getElementById("h-title").style.fontSize = "20px";
        document.getElementById("h-subtitle").style.fontSize = "0px";
        document.getElementById("h-subtitle").style.opacity = "0";
        document.getElementById("blank-top").style.height = "133px";
    } else if (scrollTop > 20) {
        document.getElementById("h-title").style.fontSize = "33px";
        document.getElementById("h-subtitle").style.fontSize = "10px";
        document.getElementById("h-subtitle").style.opacity = "0.7";
        document.getElementById("blank-top").style.height = "147px";

    }else {
        document.getElementById("h-title").style.fontSize = "40px";
        document.getElementById("h-subtitle").style.fontSize = "15px";
        document.getElementById("h-subtitle").style.opacity = "1";
        document.getElementById("blank-top").style.height = "156px";
    }
    
    if (scrollTop > 290) {
        document.getElementById("mapView").style.opacity = ".2";
        document.getElementById("top10View").style.opacity = ".2";

    } else if (scrollTop > 235) {
        document.getElementById("mapView").style.opacity = ".5";
        document.getElementById("top10View").style.opacity = ".5";

    } else {
        document.getElementById("mapView").style.opacity = "1";
        document.getElementById("top10View").style.opacity = "1";
    }
}

const dispatcher = d3.dispatch('type_filtered', 'category_selected', 'time', 'country_selected');

dispatcher.on('type_filtered', updateTypeSelection);

dispatcher.on('category_selected', updateCategorySelection);

dispatcher.on('time', updateDateRange);

dispatcher.on('country_selected', updateCountry);

function iterateThroughData(data, start, end, country) {
    isCalculating = true;
    if (country === 'all') {
        country = null
    }
    data.forEach(d => {
        d.maxViews = 0;
        d.maxLikes = 0;
        d.maxDislikes = 0;
        d.maxComments = 0;
        d.maxNViews = 0;
        d.maxNLikes = 0;
        d.maxNDislikes = 0;
        d.maxNComments = 0;
        if (start && end && country) {
            d.TrendingDatesFiltered = d.TrendingDates.filter(t => t.TrendingDate.getTime() >= start && t.TrendingDate.getTime() <= end && t.Country === country);
        } else if (start && end) {
            d.TrendingDatesFiltered = d.TrendingDates.filter(t => t.TrendingDate.getTime() >= start && t.TrendingDate.getTime() <= end);
        } else if (country) {
            d.TrendingDatesFiltered = d.TrendingDates.filter(t => t.Country === country);
        } else {
            d.TrendingDatesFiltered = d.TrendingDates;
        }
        d.TrendingDatesFiltered.forEach(t => {
            d.maxViews = t.ViewCount > d.maxViews ? t.ViewCount : d.maxViews;
            d.maxLikes = t.Likes > d.maxLikes ? t.Likes : d.maxLikes;
            d.maxDislikes = t.Dislikes > d.maxDislikes ? t.Dislikes : d.maxDislikes;
            d.maxComments = t.CommentCount > d.maxComments ? t.CommentCount : d.maxComments;
            d.maxNViews = t.NormalizedViewCount > d.maxNViews ? t.NormalizedViewCount : d.maxNViews;
            d.maxNLikes = t.NormalizedLikes > d.maxNLikes ? t.NormalizedLikes : d.maxNLikes;
            d.maxNDislikes = t.NormalizedDislikes > d.maxNDislikes ? t.NormalizedDislikes : d.maxNDislikes;
            d.maxNComments = t.NormalizedCommentCount > d.maxNComments ? t.NormalizedCommentCount : d.maxNComments;
        })
    })

    isCalculating = false
    return data;
}



Promise.all([
    // d3.json('data/world-110m.json'),
    // d3.csv('data/country-info.csv'),
    // d3.json(datasetloc),
    // d3.json('data/categories-titles.json')

]).then(data_old => {
    localData = [];
    localData[0] = world_data
    localData[1] = country_info
    localData[2] = small_data
    localData[3] = category_titles
    let data = localData
    data[1].forEach(d => {
        d.size = +d.size;
    })

    dataset = data[2]
    dataset.forEach(d => {
        d.duration = +d.duration;
        d.CategoryID = +d.CategoryID;
        d.maxViews = 0;
        d.maxLikes = 0;
        d.maxDislikes = 0;
        d.maxComments = 0;
        d.maxNViews = 0;
        d.maxNLikes = 0;
        d.maxNDislikes = 0;
        d.maxNComments = 0;
        d.PublishedDate = new Date(d.PublishedDate);
        d.TrendingDates.filter(t=>t.Country !== "ca");
        d.TrendingDates.forEach(t => {
            t.TrendingDate = new Date(t.TrendingDate);
            t.VideoID = d.VideoID;
            t.CategoryID = d.CategoryID;
            t.Likes = +t.Likes;
            t.Dislikes = +t.Dislikes;
            t.CommentCount = +t.CommentCount;
            t.ViewCount = +t.ViewCount;
            t.NormalizedLikes = +t.NormalizedLikes;
            t.NormalizedDislikes = +t.NormalizedDislikes;
            t.NormalizedViewCount = +t.NormalizedViewCount;
            t.NormalizedCommentCount = +t.NormalizedCommentCount;

            d.maxViews = t.ViewCount > d.maxViews ? t.ViewCount : d.maxViews;
            d.maxLikes = t.Likes > d.maxLikes ? t.Likes : d.maxLikes;
            d.maxDislikes = t.Dislikes > d.maxDislikes ? t.Dislikes : d.maxDislikes;
            d.maxComments = t.CommentCount > d.maxComments ? t.CommentCount : d.maxComments;
            d.maxNViews = t.NormalizedViewCount > d.maxNViews ? t.NormalizedViewCount : d.maxNViews;
            d.maxNLikes = t.NormalizedLikes > d.maxNLikes ? t.NormalizedLikes : d.maxNLikes;
            d.maxNDislikes = t.NormalizedDislikes > d.maxNDislikes ? t.NormalizedDislikes : d.maxNDislikes;
            d.maxNComments = t.NormalizedCommentCount > d.maxNComments ? t.NormalizedCommentCount : d.maxNComments;
            trendingDates.push(t);

        })
        d.TrendingDates = d.TrendingDates.filter(t => t.Country !== 'ca');
        d.TrendingDatesFiltered = d.TrendingDates;
    })

    categories = data[3];
    categories.forEach(d => {
        d.id = +d.id
    })

    timelineView = new TimelineView({
        parentElement: '#timelineView'
    }, trendingDates, dispatcher, type);

    mapView = new MapView({
        parentElement: '#mapView'
    }, dispatcher, data[0], data[1], dataset, type);

    tableView = new TableView({
        parentElement: '#top10View'
    }, dataset, type);

    bubbleView = new BubblesView({
        parentElement: '#bubblesView'
    }, dispatcher, categories, dataset, type);


    heatmapView = new HeatmapView({
        parentElement: '#heatmapView'
    }, dataset, type);

    tableView.updateVis()
    bubbleView.updateVis()
    heatmapView.updateVis();
    timelineView.updateVis();


    d3.select("#bubblesView").raise();
})
    .catch(error => console.error(`error: ${error}, trace: ${error.stack}`));


function categoryEventListener() {
    updateCategorySelection(+document.getElementById('category-selector').value, false)
}

function countryEventListener() {
    updateCountry(document.getElementById('country-selector').value)
}

function typeEventListener() {
    const typeNum = +document.getElementById('type-selector').value
    if (typeNum === 0) type = type0;
    if (typeNum === 1) type = type1;
    if (typeNum === 2) type = type2;
    if (typeNum === 3) type = type3;
    updateTypeSelection(type)
}

function updateCategorySelection(selectedCategory, updateMenuBar = true) {
    category = selectedCategory

    mapView.category = selectedCategory;
    bubbleView.category = selectedCategory;
    tableView.category = selectedCategory;
    let filteredData = dataset;
    let filteredTrendingDates = trendingDates;
    if (category !== 0) {
        filteredData = filteredData.filter(d => d.CategoryID === category)
        filteredTrendingDates = filteredTrendingDates.filter(d => d.CategoryID === category);
    }

    timelineView.data = filteredTrendingDates;
    timelineView.rerender();
    filteredData = iterateThroughData(filteredData, timerange[0], timerange[1])

    tableView.data = filteredData;
    mapView.data = filteredData;
    heatmapView.data = filteredData;

    tableView.updateVis();
    mapView.updateVis();
    heatmapView.updateVis();
    bubbleView.updateSelection(category);


    if (updateMenuBar) {
        document.getElementById('category-selector').value = category
    }else{
        bubbleView.updateStroke()
    }
}

function updateTypeSelection(selectedType) {
    type = selectedType
    tableView.updateType(type)
    mapView.type = type;
    heatmapView.type = type;
    bubbleView.type = type;
    timelineView.type = type;

    bubbleView.rerender()
    mapView.updateVis();
    heatmapView.updateVis();
    tableView.updateVis();
    timelineView.rerender();
}

function updateDateRange(range) {
    timerange = range;


    let dataForBubbles = dataset;
    if (country !== 'all') {
        dataForBubbles = iterateThroughData(dataForBubbles, timerange[0], timerange[1], country);
    }

    let filteredData = dataset;
    if (category !== 0) {
        filteredData = filteredData.filter(d => d.CategoryID === category);
    }

    let dataForMap = iterateThroughData(filteredData, timerange[0], timerange[1]);
    filteredData = iterateThroughData(filteredData, timerange[0], timerange[1]);

    bubbleView.data = dataForBubbles;
    bubbleView.rerender(dataForBubbles);

    tableView.data = filteredData;
    mapView.data = dataForMap;
    heatmapView.data = filteredData;
    tableView.updateVis();
    mapView.updateVis();
    heatmapView.updateVis();
}

function updateCountry(selectedCountry) {
    country = selectedCountry;
    let dataForBubbles = dataset;
    dataForBubbles = iterateThroughData(dataForBubbles, timerange[0], timerange[1], country);
    bubbleView.data = dataForBubbles;
    bubbleView.rerender(dataForBubbles);

    let filteredData = dataset;
    let timelineData = trendingDates;

    if (category !== 0) {
        filteredData = filteredData.filter(d => d.CategoryID === category);
        timelineData = timelineData.filter(d => d.CategoryID === category);
    }

    if (country !== 'all') {
        timelineData = timelineData.filter(d => d.Country === country);
    }

    timelineView.data = timelineData;
    timelineView.rerender();

    filteredData = iterateThroughData(filteredData, timerange[0], timerange[1], country);

    tableView.data = filteredData;
    heatmapView.data = filteredData;

    tableView.updateVis();
    heatmapView.updateVis();
    mapView.updateSelection(country);

    document.getElementById('country-selector').value = country;
}


function format(data){
    let formattedData = data / 1000000000
    if (formattedData > 1) {
        formattedData = formattedData.toFixed(3) + " B"
    } else if (formattedData > 0.001) {
        formattedData = decFormat(data/1000000) + " M"
    } else {
        formattedData = thouSeparator(data)
    }
    return formattedData
}

function formatCompact(data){
    let formattedData = data / 1000000000
    if (formattedData > 0.1) {
        formattedData = formattedData.toFixed(1)
    } else if (formattedData > 0.001) {
        formattedData = (data/1000000).toFixed(1)
    } else {
        formattedData = thouSeparator(data)
    }
    return formattedData
}

function getFormatSize(data){
    let formattedData = data / 1000000000
    if (formattedData > 0.1) {
        formattedData = "B"
    } else if (formattedData > 0.001) {
        formattedData = "M"
    } else {
        formattedData = " "
    }
    return formattedData
}