//------------------------------------------------//
// Leaflet map with proportional symbols - Power  //
//------------------------------------------------//

// map options
var options = {
    center: [38, -95],
    zoom: 4
}


// create a Leaflet map in our division container with id of 'map'
var map1 = L.map('map1', options);

// Leaflet providers base map URL
var basemap_source =
    'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/dark_all/{z}/{x}/{y}.png'

    // Add a title in the top center of the map
    var title = L.control({ position: 'topleft' });

    title.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'map-title');
        div.innerHTML = '<h2 style="color: white; text-align: center;">Power Plants Map</h2>';
        return div;
    };

    title.addTo(map1);

// Leaflet providers attributes
var basemap_options = {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
};

// Add a title above the toggle buttons
var titleControl = L.control({ position: 'topright' });

titleControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'title-control');
    div.innerHTML = '<h3 style="color: white;">Select Fuel Sources</h3>';
    return div;
};

titleControl.addTo(map1);

// request some basemap tiles and add to the map
var tiles = L.tileLayer(basemap_source, basemap_options).addTo(map1);

plants.features.sort(function (a, b) {
    return b.properties.capacity_mw - a.properties.capacity_mw;
});

var fill_color;

// map fuel sources to colors
var colors = {
    "Hydro" : 'blue',
    "Pumped Storage" : 'cyan',
    "Nuclear" : 'yellow',
    "Natural Gas" : 'red',
    "Petroleum" : 'purple',
    "Coal" : 'lightgrey',
    "Solar" : 'orange',
    "Geothermal" : 'darkgreen',
    "Wind" : 'lightgreen',
    "Other" : 'grey',
    "Other Fossil Gasses" : 'darkred',
    "Biomass" : 'brown',
    "Wood" : 'darkyellow'
};

var curr_highlight_color = '';

var display_array = [];

var final_fuel_source = '';

L.geoJson(plants, {
    
    filter: function (feature) {
        if (Object.keys(feature.properties.fuel_source).length > 1) { // if multiple fuel sources, compare and get max
            var current_max = 0; // keep track of max value and key
            var current_key = '';
            for (const [key, value] of Object.entries(feature.properties.fuel_source)) {
                if (value > current_max) {
                    current_max = value;
                    current_key = key;
                }
            }
            final_fuel_source = current_key; // at the end of the loop, set the final fuel source
        } else { // if one fuel source set final fuel source
            final_fuel_source = Object.keys(feature.properties.fuel_source)[0];
            feature.properties.highlightColor = colors[final_fuel_source];
        }

        return feature; // allow circle to be drawn
    },

    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
        color: colors[final_fuel_source], // fill color based on fuel source
        weight: 1,
        fillColor: colors[final_fuel_source], // fill color based on fuel source
        fillOpacity: 0.3,
        radius: getRadius(feature.properties.capacity_mw)
    });
},
onEachFeature: function (feature, layer) {
    var popup =
        '<p><b>' + layer.feature.properties.plant_name + '</b></p>' +
        '<p>Max capacity: ' + layer.feature.properties.capacity_mw + ' MW</p>' +
        '<p>' + final_fuel_source + ':' + layer.feature.properties.fuel_source[final_fuel_source] + 'MW</p>';

    layer.on('mouseover', function (e) {
        layer.bindPopup(popup).openPopup();
        layer.setStyle({
            fillColor: "yellow", // Use the original color here
            fillOpacity: 1
        });
    });

    layer.on('mouseout', function (e) {
        layer.setStyle({
            fillColor: e.properties.highlightColor, // Use the original color here
            fillOpacity: 0.3
        });
        layer.bindPopup(popup).closePopup();
    });
}
}).addTo(map1);

function getRadius(area) {
    var radius = Math.sqrt(area / Math.PI);
    return radius * 0.6;
};

// Set default selected fuel sources
var defaultFuelSources = ['Coal', 'Hydro'];

// Check the default checkboxes
document.addEventListener('DOMContentLoaded', function () {
    var checkboxes = document.querySelectorAll('.fuel-source-control input[type=checkbox]');
    checkboxes.forEach(function (checkbox) {
        if (defaultFuelSources.includes(checkbox.value)) {
            checkbox.checked = true;
        }
    });

    // Update the map with the default selected fuel sources
    updateMap();
});
// Create a control for the fuel source checkboxes
var fuelSourceControl = L.control({ position: 'topright' });

fuelSourceControl.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'fuel-source-control');
    var fuelSources = Object.keys(colors);

    fuelSources.forEach(function (source) {
        var label = L.DomUtil.create('label', '', div);
        var checkbox = L.DomUtil.create('input', '', label);
        checkbox.type = 'checkbox';
        checkbox.value = source;
        checkbox.onchange = function () {
            updateMap();
        };
        label.appendChild(document.createTextNode(source));
    });

    return div;
};
var style = document.createElement('style');
style.innerHTML = `
    .fuel-source-control label {
        color: white;
    }
`;
document.head.appendChild(style);
var style = document.createElement('style');
style.innerHTML = `
    .fuel-source-control {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    .fuel-source-control label {
        color: white;
        margin-bottom: 5px;
    }
`;
document.head.appendChild(style);

// Function to update the map based on the selected fuel sources
function updateMap() {
    var selectedFuelSources = [];
    var checkboxes = document.querySelectorAll('.fuel-source-control input[type=checkbox]');
    checkboxes.forEach(function (checkbox) {
        if (checkbox.checked) {
            selectedFuelSources.push(checkbox.value);
        }
    });

    map1.eachLayer(function (layer) {
        if (layer instanceof L.CircleMarker) {
            map1.removeLayer(layer);
        }
    });

    L.geoJson(plants, {
        filter: function (feature) {
            if (Object.keys(feature.properties.fuel_source).length > 1) {
                var current_max = 0;
                var current_key = '';
                for (const [key, value] of Object.entries(feature.properties.fuel_source)) {
                    if (value > current_max) {
                        current_max = value;
                        current_key = key;
                    }
                }
                final_fuel_source = current_key;
            } else {
                final_fuel_source = Object.keys(feature.properties.fuel_source)[0];
            }

            return selectedFuelSources.includes(final_fuel_source);
        },
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                color: colors[final_fuel_source],
                weight: 1,
                fillColor: colors[final_fuel_source],
                fillOpacity: 0.3,
                radius: getRadius(feature.properties.capacity_mw)
            });
        },
        onEachFeature: function (feature, layer) {
            var popup =
                '<p><b>' + layer.feature.properties.plant_name + '</b></p>' +
                '<p>Max capacity: ' + layer.feature.properties.capacity_mw + ' MW</p>' +
                '<p>' + final_fuel_source + ':' + layer.feature.properties.fuel_source[final_fuel_source] + 'MW</p>';

            layer.on('mouseover', function () {
                layer.bindPopup(popup).openPopup();
                layer.setStyle({
                    fillColor: 'yellow',
                    fillOpacity: 1
                });
            });

            layer.on('mouseout', function (e) {
                // console.log(e);
                // console.log(e.sourceTarget.feature.properties.highlightColor)
                layer.setStyle({
                    fillColor: e.sourceTarget.feature.properties.highlightColor, // wuh
                    fillOpacity: 0.3
                });
                layer.bindPopup(popup).closePopup();
            });
        }
    }).addTo(map1);
}

fuelSourceControl.addTo(map1);  