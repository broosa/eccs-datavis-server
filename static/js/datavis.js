var dataMap;
var markers = [];

var mapInit = function() {
	
	var mapProps = {
		center: new google.maps.LatLng(64.810, -18.245),
		zoom: 6,
		mapTypeId:google.maps.MapTypeId.TERRAIN
	};
	dataMap = new google.maps.Map(document.getElementById("map-viewport"), mapProps);
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
        element.trigger("chosen:updated", true)
    });
};

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

var onSampleTypeChanged = function() {
    chosenElement = $("#dropdown-sample-type").chosen();
    if  (chosenElement.val() != "") {
        datasetName = $("#dropdown-dataset").chosen().val();
		date = $("#dropdown-date").chosen().val();
        place = $("#dropdown-place").chosen().val();
        sampleType = chosenElement.val();
        ajaxURL = ["api", datasetName, date, place, sampleType].join("/") + "/";
        
        console.log("Populating map!");
        $.ajax({
            url: ajaxURL,
            success: function(data) {
                $.each(data.data, function(index, value) {
                    pointLoc = new google.maps.LatLng(value[10], value[9]);    
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
            }
        });
    }
};

$(document).ready(function () {
	console.log("Setting up comboboxes");
	$(".chosen-select").chosen({disable_search_threshold: 10});
    
    dropdownInit();
    $("#dropdown-dataset").chosen().change(onDatasetChanged);
    $("#dropdown-date").chosen().change(onDateChanged);
    $("#dropdown-place").chosen().change(onPlaceChanged);
    $("#dropdown-sample-type").chosen().change(onSampleTypeChanged);
});
