window.onload = function()
	{
		var contentDiv = $("#content");

		for (var cnt = 0; cnt < 31; cnt++)
		{
			contentDiv.append("<div class='day'>" + cnt + "</div>");
		}
	}