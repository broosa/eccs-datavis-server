  var dataMap;
var markers = [];
var selected_marker = null;

function mapInit() {

    var mapConfig = {};

    var deferred = $.Deferred();

    $.get("/api/map/config/").done(function(data) {

        dataMap = L.map('map-viewport').setView(data.center, data.zoom);

        var baseLayer = new L.TileLayer(data.url, {
            attribution: data.attrib,
            maxZoom: 18,
        });

        dataMap.invalidateSize(false);
        dataMap.addLayer(baseLayer);

        deferred.resolve();
    });

    return deferred;

};

//Disables the download button (deprecated?)
function resetCSVButton() {
    element = $("#btn-csv-download");
    element.attr("href", "#");
    element.addClass("disabled");
};

function mapClearMarkers() {
    while (markers.length > 0) {
        var marker = markers.pop();
        dataMap.removeLayer(marker);
    }
};

//Clears all options from a dropdown
function resetDropdown(element) {
    element.val(element.children("option:first").val());
    element.children("option").not("[value='']").remove();
    element.trigger("chosen:updated", true);
};

//Enables a dropdown
function enableDropdown(element) {
    element.prop("disabled", false);
    element.trigger("chosen:updated", true);
};

//Disables a dropdown
function disableDropdown(element) {
    element.prop("disabled", "disabled");
    element.trigger("chosen:udpated", true);
};

function populateDropdown(element, data) {
    //For each item in the data, add an <option> element
    $.each(data, function(index, value) {
        option = $("<option></option>").attr("value", value).text(value);
        element.append(option);
        element.trigger("chosen:updated", true);
    });
};

function setDropdownValue(element, value) {
    element.chosen().val(value)
    element.trigger("chosen:updated");
};

function onStartFilterSelect() {
    mapClearMarkers();
    resetCSVButton();
    //Hide the buttons
    //Show the filter selector
    $("#button-container").slideUp(200, function() {
        $("#filter-container").slideDown();
    });
    //Hide the graph
    $("#timeplot-container").animate({
        bottom: "-250px"
    }, 200);
};

function getFilterData(args) {
    var urlTokens = ["api"];
    for (var i = 0; i < arguments.length; i++) {
        if (i == arguments.length - 1) {
            arguments[i] += "/";
        }
        urlTokens.push(arguments[i]);
    }

    var ajaxUrl = urlTokens.join("/");
    return $.get(ajaxUrl);
};

function dropdownInit() {

    return getFilterData("trips").done(function(data) {
        console.log("Populating dropdowns...");
        populateDropdown($("#dropdown-trip"), data.trips);
    });
};

function eventInit() {
    //Register dropdown event handlers
    $("#dropdown-trip").chosen().change(onTripChanged);
    $("#dropdown-date").chosen().change(onDateChanged);
    $("#dropdown-place").chosen().change(onPlaceChanged);
    $("#btn-show-filter-select").click(onStartFilterSelect);
    $("#btn-load-data").click(onLoadData);
    $("#timeplot-container").bind("plothover", onPlotHover);

    console.log("Setting up comboboxes");
    $(".chosen-select").chosen({
        disable_search_threshold: 10
    });

}

function onTripChanged() {
    console.log("Handling dropdown change event...");
    chosenElement = $("#dropdown-trip").chosen()
    if (chosenElement.val() != "") {

        tripName = chosenElement.val();

        getFilterData(tripName, "dates").done(function(data) {
            console.log("Populating date dropdown");

            enableDropdown($("#dropdown-date"));

            resetDropdown($("#dropdown-date"));
            resetDropdown($("#dropdown-place"));
            resetDropdown($("#dropdown-sample-type"));

            disableDropdown($("#dropdown-place"));
            disableDropdown($("#dropdown-sample-type"));

            populateDropdown($("#dropdown-date"), data.dates);
        });
    }
};

function onDateChanged() {
    chosenElement = $("#dropdown-date").chosen();
    if (chosenElement.val() != "") {
        console.log("foobar");

        tripName = $("#dropdown-trip").chosen().val();
        date = chosenElement.val();
        getFilterData(tripName, date, "places").done(function(data) {
            console.log("Populating place dropdown");

            enableDropdown($("#dropdown-place"));

            resetDropdown($("#dropdown-place"));
            resetDropdown($("#dropdown-sample-type"));

            disableDropdown($("#dropdown-sample-type"));
            populateDropdown($("#dropdown-place"), data.places);
        });
    }
};

function onPlaceChanged() {

    chosenElement = $("#dropdown-place").chosen();
    if (chosenElement.val() != "") {
        tripName = $("#dropdown-trip").chosen().val();
        date = $("#dropdown-date").chosen().val();
        place = chosenElement.val();

        getFilterData(tripName, date, place, "sample-types").done(function(data) {
            console.log("Populating place dropdown");

            enableDropdown($("#dropdown-sample-type"));
            resetDropdown($("#dropdown-sample-type"));

            populateDropdown($("#dropdown-sample-type"), data.sampleTypes);
        });
    }
};

function onLoadData() {

    var deferred = $.Deferred();
    if ($("#dropdown-sample-type").val() != "") {
        tripName = $("#dropdown-trip").chosen().val();
        tripIndex = $("#dropdown-trip").prop("selectedIndex");

        date = $("#dropdown-date").chosen().val();
        dateIndex = $("#dropdown-date").prop("selectedIndex");

        place = $("#dropdown-place").chosen().val();
        placeIndex = $("#dropdown-place").prop("selectedIndex");

        sampleType = $("#dropdown-sample-type").chosen().val();
        sampleTypeIndex = $("#dropdown-sample-type").prop("selectedIndex");

        ajaxURL = ["api", tripName, date, place, sampleType].join("/") + "/";

        //Generate a permalink
        hashids = new Hashids();
        filterID = hashids.encode(tripIndex, dateIndex, placeIndex, sampleTypeIndex);

        permalinkURL = ["/filter", filterID, ""].join("/")
        $("#filter-link").attr("href", permalinkURL);
        console.log("Populating map!");

        mapClearMarkers();
        getFilterData(tripName, date, place, sampleType).done(function(data) {
            //Create a map marker from each latitude/longitude pair
            $.each(data.data, function(index, value) {
                pointLoc = new L.LatLng(value[10], value[11]);
                var marker = new L.CircleMarker(pointLoc, {
                    radius: 2,
                    opacity: 1.0,
                    fillOpacity: 1.0
                });
                markers.push(marker);
            });

            markerGroup = L.featureGroup(markers);

            markerBounds = markerGroup.getBounds().pad(0.5);
            markerGroup.addTo(dataMap);
            //Set the map so that it fits all the points we've just gotten
            dataMap.fitBounds(markerBounds);

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
                return [
                    [date, data_value, {
                        point_index: i
                    }]
                ];
            });

            datasets = [{
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
                canvas: true,
                xaxes: [{
                    mode: "time"
                }],
                grid: {
                    margin: 20,
                    clickable: true,
                    hoverable: true,
                    mouseActiveRadius: 200
                }
            }

            //console.log(data_series);

            $.plot($("#timeplot-container"), datasets, options);
            $("#timeplot-container").animate({
                bottom: "30px"
            }, 200);

            deferred.resolve()
        });

        return deferred;
    }
};

function onPlotHover(event, pos, item) {
    if (item != null) {
        point_index = item.dataIndex;

        //console.log("Selecting new marker");
        hover_point = markers[point_index];

        if (selected_marker != hover_point) {
            hover_point.setStyle({color: "#FF0000", fillColor: "#FF0000"});
        }

        if (selected_marker != null && selected_marker != hover_point) {
            selected_marker.setStyle({color: "#0000FF", fillColor: "#0000FF"});
        }

        selected_marker = hover_point;
        selected_marker.bringToFront();
    }
};

function loadFilter() {

    if (filterID == "") {
        return;
    }

    deferred = $.Deferred();

    hashids = new Hashids();
    filter_info = hashids.decode(filterID);

    var tripName = "";
    var date = "";
    var place = "";
    var sampleType = "";

    //Load the trips for the given filter
    $.get("api/trips/").done(function(data) {
        tripName = data.trips[filter_info[0] - 1];
    }).then(function () {

        //Load the available dates
        return getFilterData(tripName, "dates").done(function(data) {
            populateDropdown($("#dropdown-date"), data.dates);
            date = data.dates[filter_info[1] - 1];
        });
    }).then(function() {

        //Load Places
        return getFilterData(tripName, date, "places").done(function(data) {
            populateDropdown($("#dropdown-place"), data.places);
            place = data.places[filter_info[2] - 1];
        });
    }).then(function() {
        return getFilterData(tripName, date, place, "sample-types").done(function(data) {
            populateDropdown($("#dropdown-sample-type"), data.sampleTypes);
            sampleType = data.sampleTypes[filter_info[3] - 1];
        });
    }).then(function() {
        //TODO: find better way to load initial selections
        enableDropdown($("#dropdown-trip"));
        setDropdownValue("#dropdown-trip", tripName);

        enableDropdown($("#dropdown-date"));
        setDropdownValue("#dropdown-date", date);

        enableDropdown($("#dropdown-place"));
        setDropdownValue("#dropdown-place", place);

        enableDropdown($("#dropdown-sample-type"));
        setDropdownValue("#dropdown-sample-type", sampleType);

        onLoadData();
    });
}

$(window).load(function() {
    $.when(mapInit(), dropdownInit(), eventInit()).then(loadFilter()).done(function () {
        $("#filter-container").slideDown(200);
        $('#loading-overlay').delay(1000).fadeOut(500);
    });
});
