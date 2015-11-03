var dataMap;
var markers = [];
var selected_marker = null;

var mapInit = function() {
	
	var mapProps = {
		center: new google.maps.LatLng(64.810, -18.245),
		zoom: 6,
		mapTypeId:google.maps.MapTypeId.TERRAIN	
	};
	dataMap = new google.maps.Map(document.getElementById("map-viewport"), mapProps);
};

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
    $.each(data, function(index, value) {
        option = $("<option></option>").attr("value", value).text(value);
        element.append(option);
        element.trigger("chosen:updated", true);
    });
};

var onStartFilterSelect = function() {
    mapClearMarkers();
    resetCSVButton();
	$("#button-container").slideUp(200, function() {
	    	$("#filter-container").slideDown();
	});
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

				datasets = [{
					label: sampleType,
					data: data_series,
					color: "#0000BB",
					lines: {
						show: true
					},
					points: {
						fillColor: "#FF0000",
						//show: true
					}
				}];

				options = {
					canvas: true,
					xaxes: [{
						mode: "time"
					}],
					grid: {
						margin: 20
					}
				}
				
				$.plot($("#timeplot-container"), datasets, options);
				$("#timeplot-container").animate({bottom: "30px"}, 200);
            }
        });
    }
};

var onPlotHover = function(event, pos, item) {
    point_index = item[2].point_index;

    console.log("Selecting new marker");
    hover_point = markers[point_index];
    
    if (selected_marker != null) {
        selected_marker.icon = "https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle_blue.png";
    }

    hover_point.icon = "https://maps.gstatic.com/intl/en_us/mapfiles/markers2/measle.png";
    selected_marker = hover_point;
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
