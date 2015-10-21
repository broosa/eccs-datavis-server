var dataMap;

var mapInit = function() {
	
	var mapProps = {
		center: new google.maps.LatLng(64.810, -18.245),
		zoom: 6,
		mapTypeId:google.maps.MapTypeId.ROADMAP
	};
	dataMap = new google.maps.Map(document.getElementById("map-viewport"), mapProps);
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
            populateDropdown($("#dropdown-dataset"), data);
        }
    });
};

var onDatasetChanged = function() {
    console.log("Handling dropdown change event...");
    chosenElement = $("#dropdown-dataset").chosen()
    if (chosenElement.val() != "") {
        $("#dropdown-date").removeAttr("disabled");
        $("#dropdown-date").trigger("chosen:updated", true);
        
        datasetName = chosenElement.val();
        ajaxURL = "api/" + datasetName + "/dates/";
        $.ajax({
            url: ajaxURL,
            success: function(data) {
                console.log("Populating date dropdown");
                populateDropdown($("#dropdown-date"), data.dates);
            }
        });
    }
};

var onDateChanged = function() {

};

var onPlaceChanged = function() {

};

var onSampleTypeChanged = function() {

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
