var _sidebarVisible = false;

$(document).ready(
	function()
	{
		var month = getCurrentMonth();
		fillCalendarView(month);

	    setHandlers();
	});

function setHandlers()
{
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

		_sidebarVisible = false;
		return;
	}

	contentDiv.css("margin-left", sidebarWidth + "px");
	sidebarDiv.css("margin-left", "0px");

	_sidebarVisible = true;
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

function getMonthName(month)
{
	switch (month)
	{
		case 0:
			return "January";

		case 1:
			return "February";

		case 2:
			return "March";

		case 3:
			return "April";

		case 4:
			return "May";

		case 5:
			return "June";

		case 6:
			return "July";

		case 7:
			return "August";

		case 8:
			return "September";

		case 9:
			return "October";

		case 10:
			return "November";

		case 11:
			return "December";
	}
}

function fillCalendarView(month)
{
	var monthName = getMonthName(month);

	var monthTitleDiv = $("#month");
	monthTitleDiv.text(monthName);

	var daysDiv = $("#days");

	var firstDay = getDayOfWeek(1, month, 2015);
	for (var cnt = 0; cnt < firstDay; cnt++)
	{
		daysDiv.append("<div class='dummyDay'>&nbsp</div>");
	}

	var days = getDaysInMonth(month);
	for (var cnt = 0; cnt < days; cnt++)
	{
		var day = cnt + 1;
		daysDiv.append("<div class='day'>" + day + "</div>");
	}

	var lastDay = getDayOfWeek(days, month, 2015);
	var daysToAdd = 6 - lastDay;
	
	for (var cnt = 0; cnt < daysToAdd; cnt++)
	{
		daysDiv.append("<div class='dummyDay'>&nbsp</div>");
	}
}

function getDayOfWeek(day, month, year)
{
	var date = new Date(year, month, day, 1, 1, 1, 1);
	return date.getDay();
}