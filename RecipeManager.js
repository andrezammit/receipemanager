var _sidebarVisible = false;

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
	$("#title").on("click", onTitleClick);
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
		resultsDiv.css("pointer-events", "none");

		calendarDiv.css("opacity", 100);

		return;
	}

	resultsDiv.css("opacity", 100);
	resultsDiv.css("pointer-events", "auto");

    calendarDiv.css("opacity", 0);
}

function onTitleClick()
{
	var sidebarDiv = $("#sidebar");
	var contentDiv = $("#content");

	var sidebarWidth = sidebarDiv.width();

	if (_sidebarVisible)
	{
		sidebarDiv.css("margin-left", "-" + sidebarWidth + "px");
		contentDiv.css("margin-left", "0px");

		setContainerWidth();

		_sidebarVisible = false;
		return;
	}

	contentDiv.css("margin-left", sidebarWidth + "px");
	sidebarDiv.css("margin-left", "0px");

	setContainerWidth();

	_sidebarVisible = true;
}

function setContainerWidth()
{
	var dayDiv = $(".day");
	var calendarDiv = $("#calendar");

    calendarDiv.css("width", "auto");
    
    var windowWidth = $("#content").width();
    var blockWidth = dayDiv.outerWidth(true);
    
    var maxBoxPerRow = Math.floor(windowWidth / blockWidth);
    calendarDiv.width(maxBoxPerRow * blockWidth);
}

function getCurrentMonth()
{
	var date = new Date();
	return date.getMonth() + 1;
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

function getMonthName(month)
{
	switch (month)
	{
		case 1:
			return "January";

		case 2:
			return "February";

		case 3:
			return "March";

		case 4:
			return "April";

		case 5:
			return "May";

		case 6:
			return "June";

		case 7:
			return "July";

		case 8:
			return "August";

		case 9:
			return "September";

		case 10:
			return "October";

		case 11:
			return "November";

		case 12:
			return "December";
	}
}

function fillCalendarView(month)
{
	var monthName = getMonthName(month);

	var monthTitleDiv = $("#month");
	monthTitleDiv.text(monthName);

	var daysDiv = $("#days");

	var days = getDaysInMonth(month);
	for (var cnt = 0; cnt < days; cnt++)
	{
		var day = cnt + 1;
		daysDiv.append("<div class='day'>" + day + "</div>");
	}
}
