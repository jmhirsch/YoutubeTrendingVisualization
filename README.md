# Project

## Preview
![Thumbnail](thumbnail.png?raw=true "Youtube Vis Thumbnail")

## Running

Our project will run using the small dataset by default. To use the full dataset, unzip 'fullsizedata.json.zip' to '
fullsizedata.json', comment out line 5 in main.js, and uncomment line 6 in main.js

## File Location

### Main

- main: `src/js/main.js`
- index: `src/index.html`

### Views

- Map: `src/js/mapView.js`
- Category Bubbles: `src/js/categoryBubbles.js`
- Most Popular Videos Table: `src/js/top10Table.js`
- Timeline: `src/js/timeline.js`
- Heatmap: `src/js/heatmap.js`

### Libraries & Styling

- css: `src/css/style.css`
- d3: `src/js/d3.v6.min.js`
- d3-annotations: `src/d3-annotations.min.js`
- topojson: `src/js/topojson.v3.js`

### Data

- Category names & numbers: `src/data/categories.json`
- Small Dataset: `src/data/smalldata.json`
- Fullsize Data (zip): `src/data/fullsizedata.zip`
- Country lat/lon/population: `src/data/country-info.csv`
- Country size/loc: `src/data/world-110m.json`

## Sources

### Map

Country centroid information for placing country bubbles on the centre of each country was obtained
from: https://developers.google.com/public-data/docs/canonical/countries_csv

Country population numbers were obtained from: https://www.worldometers.info/world-population/population-by-country/

The map view was built upon the tutorial code from Tutorial 6. The code was modified to display country bubbles at the
centroid of each country in our dataset. The same world map and projection were chosen as the example since it is a
recognizable world map that users are familiar with. The bubbles were changed to be size encoded by a variable that is
selected by the user (views, comments, likes and dislikes). UI changes include the ability to select and deselect
bubbles and to select the background image to reset the bubbles.

#### Grid alignment: https://stackoverflow.com/questions/45536537/centering-in-css-grid

Modified to suit our needs

### Most Popular Video Table

http://www.d3noob.org/2013/02/add-html-table-to-your-d3js-graph.html
The initial implementation was taken from the above link. The code was adapted to support transitions, updates, and
tooltips. Design changes were made, including positioning of the text, styling of the rows, and fixed row sizes.

### Timeline

https://observablehq.com/@d3/focus-context?collection=@d3/d3-brush
The brushing was taken from the context featured in the above link. The code was almost entirely stripped, removing the
dependence on the fixed data, removing the chart and the axis on the context. The brushing, scales, and area drawing of
the context were kept, the scale was adapted to fit our data, and the code was modified to support transitions,
different types of datasets, and data updates. Additionally, the listener for the brush was modified, as our dataset was
too large and could not be updated while the brush was being moved. While most of the code was removed, the brushing
logic proved to be invaluable for our project, and worked flawlessly.

The annotation was borrowed from the tutorials and adapted to fit inside the timeline

### Category Bubbles

#### Simulation:

https://bl.ocks.org/officeofjane/a70f4b44013d06b9c0a973f163d8ab7a
The simulation was taken from the above link. Minor modifications were made to better fit our code, but the bulk of the
logic remained the same. Additional changes were introduced to support updating the data contained in the nodes and
re-rendering their sizes when the underlying data changed without restarting the simulation, which proved to be
challenging.

#### Dragging: https://stackoverflow.com/questions/63616146/d3-bubble-chart-force-layout-forceattraction

The logic for dragging the bubbles was borrowed from the above SOF post. The major changes included support for other
mouse events, and moving the labels with the bubbles. This proved to be challenging as well, because the dragging events
typically consumed other mouse events, such as click and mousedown. Dragging events also prevented mouseup from firing,
so the events needed in mouseup were integrated into draggended.

The tutorials were also extensively used for animations and other UI tweaks, and GeeksForGeeks & MDN were used to aid in
CSS layouts and styling.

### Heatmap

#### Legend:

https://github.com/UBC-InfoVis/436V-materials/tree/22Jan/case-studies/case-study_measles-and-vaccines
The code for our heatmaps legend was almost entirely copied from the courses’ (CPSC 436V) case study, The Impact of
Vaccines on the Measles. Additional changes were made so to fit our colour scheme and so that the labels would show the
proper units depending on the filtered dataset.
