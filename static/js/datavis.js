var dataMap;

var mapInit = function() {
	
	var mapProps = {
		center: new google.maps.LatLng(64.810, -18.245),
		zoom: 6,
		mapTypeId:google.maps.MapTypeId.ROADMAP
	};
	dataMap = new google.maps.Map(document.getElementById("map-viewport"), mapProps);
};

var dropdownInit = function() {
    $.ajax({
        url: "api/datasets/",
        success: function(data) {
            console.log("Populating dropdowns...");
            $.each(data.datasets, function(index, value) {
                option = $("<option></option>").attr("value", value).text(value);
                $("#dropdown-dataset").append(option);
                $("#dropdown-dataset").trigger("chosen:updated", true);
            });
        }
    });
};

var onDatasetChanged = function() {
    console.log("Handling dropdown change event...");
    chosenElement = $("#dropdown-dataset").chosen()
    if (chosenElement.val() != "") {
        $("#dropdown-date").removeAttr("disabled");
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
