/*global jQuery:false, ko:false*/

/**
* loadingWhen replaces the content of a container with a loading spinner
* when the bound value is truthy.
* Styling requires the .loader class to be defined for the page as well as the loaderClass property 
* (or a default of .loader-dark)
*/
ko.bindingHandlers.loadingWhen = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var loaderClass = ko.utils.unwrapObservable(allBindingsAccessor()).loaderClass || "loader-white",
			$element = $(element),
			currentPosition = $element.css("position"),
			$loader = $("<div>", { "class": loaderClass }).addClass("loader").hide();

        //add the loader
        $element.append($loader);

        //make sure that we can absolutely position the loader against the original element
        if (currentPosition === "auto" || currentPosition === "static") {
            $element.css("position", "relative");
        }

           
    },
    update: function (element, valueAccessor) {
        var isLoading = ko.utils.unwrapObservable(valueAccessor()),
			$element = $(element),
			$childrenToHide = $element.children(":not(div.loader)"),
			$loader = $element.find("div.loader");

        if (isLoading) {
            $childrenToHide.css("visibility", "hidden").attr("disabled", "disabled");
            $loader.show();
        }
        else {
            $loader.fadeOut("fast");
            $childrenToHide.css("visibility", "visible").removeAttr("disabled");
        }
    }
};