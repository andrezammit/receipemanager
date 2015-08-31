$(document).ready(
	function()
	{
		fillCalendarView(0);
	    setContainerWidth();
	});

$(window).resize(
	function()
	{
	   setContainerWidth();
	});

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

function fillCalendarView(month)
{
	var contentDiv = $("#calendar");

	for (var cnt = 0; cnt < 31; cnt++)
	{
		contentDiv.append("<div class='day'>" + cnt + "</div>");
	}
}
