$(document).ready(
	function()
	{
		var month = getCurrentMonth();
		fillCalendarView(month);

	    setContainerWidth();
	    setHandlers();
	});

function setHandlers()
{
	$(window).resize(setContainerWidth);
	$("#searchBox").on("input propertychange paste", onSearchBoxChanged);
}

function onSearchBoxChanged()
{
	var resultsDiv = $("#results");
	var calendarDiv = $("#calendar");

	var searchBox = $("#searchBox");
	var searchText = searchBox.val();

	if (searchText == "")
	{
		resultsDiv.css("opacity", 0);
		calendarDiv.css("opacity", 100);
		return;
	}

	resultsDiv.css("opacity", 100);
    calendarDiv.css("opacity", 0);
}

function setContainerWidth()
{
	var dayDiv = $(".day");
	var calendarDiv = $("#calendar");

    calendarDiv.css("width", "auto");
    
    var windowWidth = $(document).width();
    var blockWidth = dayDiv.outerWidth(true);
    
    var maxBoxPerRow = Math.floor(windowWidth / blockWidth);
    calendarDiv.width(maxBoxPerRow * blockWidth);
}

function getCurrentMonth()
{
	var date = new Date();
	return date.getMonth();
}

function getDaysInMonth(month)
{
	switch (month)
	{
		case 4:
		case 6:
		case 9:
		case 11:
			return 30;

		case 2:
			return 28;
	}

	return 31;
}

function fillCalendarView(month)
{
	var contentDiv = $("#calendar");

	var days = getDaysInMonth(month);
	for (var cnt = 0; cnt < days; cnt++)
	{
		var day = cnt + 1;
		contentDiv.append("<div class='day'>" + day + "</div>");
	}
}
