var dataMap;
var markers = [];
var selected_marker = null;

var mapInit = function() {

    //Center the map on iceland
    var mapProps = {
center:
        new google.maps.LatLng(64.810, -18.245),
        zoom: 6,
mapTypeId:
        google.maps.MapTypeId.TERRAIN
    };
    //Instantiate the map
    dataMap = new google.maps.Map(document.getElementById("map-viewport"), mapProps);
};

//Disables the download button (deprecated?)
var resetCSVButton = function() {
    element = $("#btn-csv-download");
    element.attr("href", "#");
    element.addClass("disabled");
};

var mapClearMarkers = function() {
    while (markers.length > 0) {
        markers.pop().setMap(null);
    }
};

var resetDropdown = function(element) {
    element.val(element.children("option:first").val());
    element.children("option").not("[value='']").remove();
    element.trigger("chosen:updated", true);
};

var enableDropdown = function(element) {
    element.prop("disabled", false);
    element.trigger("chosen:updated", true);
};

var disableDropdown = function(element) {
    element.prop("disabled", "disabled");
    element.trigger("chosen:udpated", true);
};

var populateDropdown = function(element, data) {
    //For each item in the data, add an <option> element
    $.each(data, function(index, value) {
        option = $("<option></option>").attr("value", value).text(value);
        element.append(option);
        element.trigger("chosen:updated", true);
    });
};

var onStartFilterSelect = function() {
    mapClearMarkers();
    resetCSVButton();
    //Hide the buttons
    //Show the filter selector
    $("#button-container").slideUp(200, function() {
        $("#filter-container").slideDown();
    });
    //Hide the graph
$("#timeplot-container").animate({bottom: "-250px"}, 200);
}

var dropdownInit = function() {
    $.ajax({
url: "api/datasets/",
success: function(data) {
            console.log("Populating dropdowns...");
            populateDropdown($("#dropdown-dataset"), data.datasets);
        }
    });
};

var onDatasetChanged = function() {
    console.log("Handling dropdown change event...");
    chosenElement = $("#dropdown-dataset").chosen()
    if (chosenElement.val() != "") {

        datasetName = chosenElement.val();
        ajaxURL = ["api", datasetName, "dates/"].join("/");

        $.ajax({
url: ajaxURL,
success: function(data) {
                console.log("Populating date dropdown");

                enableDropdown($("#dropdown-date"));

                resetDropdown($("#dropdown-date"));
                resetDropdown($("#dropdown-place"));
                resetDropdown($("#dropdown-sample-type"));

                disableDropdown($("#dropdown-place"));
                disableDropdown($("#dropdown-sample-type"));

                populateDropdown($("#dropdown-date"), data.dates);
            }
        });
    }
};

var onDateChanged = function() {
    chosenElement = $("#dropdown-date").chosen();
    if (chosenElement.val() != "") {
        console.log("foobar");

        datasetName = $("#dropdown-dataset").chosen().val();
        date = chosenElement.val();

        ajaxURL = ["api", datasetName, date, "places/"].join("/");
        $.ajax({
url: ajaxURL,
success: function(data) {
                console.log("Populating place dropdown");

                enableDropdown($("#dropdown-place"));

                resetDropdown($("#dropdown-place"));
                resetDropdown($("#dropdown-sample-type"));

                disableDropdown($("#dropdown-sample-type"));
                populateDropdown($("#dropdown-place"), data.places);
            }
        });
    }
};

var onPlaceChanged = function() {

    chosenElement = $("#dropdown-place").chosen();
    if (chosenElement.val() != "") {
        datasetName = $("#dropdown-dataset").chosen().val();
        date = $("#dropdown-date").chosen().val();
        place = chosenElement.val();

        ajaxURL = ["api", datasetName, date, place, "sample-types/"].join("/");

        $.ajax({
url: ajaxURL,
success: function(data) {
                console.log("Populating place dropdown");

                enableDropdown($("#dropdown-sample-type"));
                resetDropdown($("#dropdown-sample-type"));

                populateDropdown($("#dropdown-sample-type"), data.sampleTypes);
            }
        });
    }
};

var onLoadData = function() {
    if  ($("#dropdown-sample-type").val() != "") {
        datasetName = $("#dropdown-dataset").chosen().val();
        date = $("#dropdown-date").chosen().val();
        place = $("#dropdown-place").chosen().val();
        sampleType = $("#dropdown-sample-type").chosen().val();

        ajaxURL = ["api", datasetName, date, place, sampleType].join("/") + "/";

        console.log("Populating map!");
        mapClearMarkers();
        $.ajax({
url: ajaxURL,
success: function(data) {
                $.each(data.data, function(index, value) {
                    pointLoc = new google.maps.LatLng(value[10], value[11]);
                    //console.log(value);
                    //console.log(pointLoc);
                    var marker = new google.maps.Marker({
position: pointLoc,
map: dataMap,
title: "Data Point",
icon: "https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle_blue.png"

                    });
                    markers.push(marker);
                });

                $("#btn-csv-download").removeClass("disabled");
                $("#btn-csv-download").attr("href", ajaxURL + "?fmt=csv");
                $("#filter-container").slideUp(200, function() {
                    $("#button-container").slideDown();
                });

                //Select the date and data value from the dataset
                //That's what needed for the map.
                data_series = $.map(data.data, function(value, i) {
                    date = Date.parse(value[2]);
                    data_value = value[6];
return [[date, data_value, {point_index: i}]];
                });

                datasets = [ {
label: sampleType,
data: data_series,
color: "#0000BB",
lines: {
show: true
                    },
points: {
fillColor: "#FF0000",
                        //We need the points for plothover to work
                        //we set the radius to 0 so they don't actually
                        //appear on screen.
show: true,
                        radius: 0
                    }
                }];

                options = {
canvas:
                    true,
xaxes:
                    [{
mode: "time"
                    }],
grid:
                    {
                        margin: 20,
clickable:
                        true,
hoverable:
                        true,
                        mouseActiveRadius: 200
                    }
                }

                console.log(data_series);

                $.plot($("#timeplot-container"), datasets, options);
$("#timeplot-container").animate({bottom: "30px"}, 200);
            }
        });
    }
};

var onPlotHover = function(event, pos, item) {
    if (item != null) {
        //console.log(item);
        point_index = item.dataIndex;

        console.log("Selecting new marker");
        hover_point = markers[point_index];

        if (selected_marker != hover_point) {
            hover_point.setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
        }

        if (selected_marker != null && selected_marker != hover_point) {
            selected_marker.setIcon("https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle_blue.png");
            selected_marker.setZIndex(0);
        }

        selected_marker = hover_point;
        selected_marker.setMap(dataMap);

        selected_marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

    }
};


$(document).ready(function () {
    console.log("Setting up comboboxes");
    $(".chosen-select").chosen({disable_search_threshold: 10});

    dropdownInit();
    $("#dropdown-dataset").chosen().change(onDatasetChanged);
    $("#dropdown-date").chosen().change(onDateChanged);
    $("#dropdown-place").chosen().change(onPlaceChanged);
    $("#btn-show-filter-select").click(onStartFilterSelect);
    $("#btn-load-data").click(onLoadData);
    $("#timeplot-container").bind("plothover", onPlotHover);
});
