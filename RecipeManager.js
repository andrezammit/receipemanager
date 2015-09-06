var _sidebarVisible = false;
var _currDate = 0;

var _db = 
	{ 
		books: [], 
		sections: [],
		recipes: []
	};

var RESULT_TYPE_BOOK 	= 1;
var RESULT_TYPE_SECTION = 2;
var RESULT_TYPE_RECIPE	= 3;

$(document).ready(
	function()
	{
		loadData();

		_currDate = getCurrentMonth();

		fillCalendarView(_currDate);
	    setHandlers();
	});

function setHandlers()
{
	$("#searchBox").on("input propertychange paste", onSearchBoxChanged);
	$("#title").on("click", onTitleClick);
	$("#prevMonth").on("click", onPrevMonthClick);
	$("#nextMonth").on("click", onNextMonthClick);
	$("#loadData").on("click", onLoadDataClick);
	$("#books").on("click", showBooks);
}

function showResultsView(show)
{
	var resultsDiv = $("#results");
	var calendarDiv = $("#calendar");

	if (show == true)
	{
		resultsDiv.show();
		calendarDiv.hide();

		return;
	}

	resultsDiv.hide();
	calendarDiv.show();
}

function onSearchBoxChanged()
{
	var searchBox = $("#searchBox");
	var searchText = searchBox.val();

	if (searchText == "")
	{
		showResultsView(false);
		return;
	}

	showResultsView(true);
}

function getBookByID(id)
{
	var size = _db.books.length;
	for(var cnt = 0; cnt < size; cnt++) 
	{
		var book = _db.books[cnt];

		if (book.id == id)
			return book;
   	}

   	return null;
}

function getSectionByID(id)
{
	var size = _db.sections.length;
	for(var cnt = 0; cnt < size; cnt++) 
	{
		var section = _db.sections[cnt];

		if (section.id == id)
			return section;
   	}

   	return null;
}

function getRecipeByID(id)
{
	var size = _db.recipes.length;
	for(var cnt = 0; cnt < size; cnt++) 
	{
		var recipe = _db.recipes[cnt];

		if (recipe.id == id)
			return recipe;
   	}

   	return null;
}


function loadBooks(dataObj)
{
	var bookTable = dataObj.objects[1];

	for(var cnt = 0; cnt < bookTable.rows.length; cnt++) 
	{
		var book = bookTable.rows[cnt];

		_db.books.push(
		{
			id: book[0],
			name: book[1],
			sections: []
		})
   	}
}

function loadSections(dataObj)
{
	var sectionTable = dataObj.objects[2];

	for(var cnt = 0; cnt < sectionTable.rows.length; cnt++) 
	{
		var section = sectionTable.rows[cnt];

		_db.sections.push(
		{
			id: section[0],
			name: section[1],
			recipes: []
		})
   	}
}

function loadRecipes(dataObj)
{
	var recipeTable = dataObj.objects[3];

	for(var cnt = 0; cnt < recipeTable.rows.length; cnt++) 
	{
		var recipe = recipeTable.rows[cnt];

		_db.recipes.push(
		{
			id: recipe[0],
			name: recipe[1],
			page: recipe[2],
			isCooked: recipe[3],
			isInteresting: recipe[4],
			comment: recipe[5]
		})
   	}
}

function loadSectionRecipes(dataObj)
{
	var sectionRecipeTable = dataObj.objects[6];

	var size = sectionRecipeTable.rows.length;
	for(var cnt = 0; cnt < size; cnt++) 
	{
		var sectionRecipe = sectionRecipeTable.rows[cnt];
		var section = getSectionByID(sectionRecipe[0]);

		if (section != null)
			section.recipes.push(sectionRecipe[1]);
   	}
}

function loadBookSections(dataObj)
{
	var bookSectionTable = dataObj.objects[7];

	var size = bookSectionTable.rows.length;
	for(var cnt = 0; cnt < size; cnt++) 
	{
		var bookSection = bookSectionTable.rows[cnt];
		var book = getBookByID(bookSection[0]);

		if (book != null)
			book.sections.push(bookSection[1]);
   	}
}

function loadDataSuccess(dataFileEntry)
{
	dataFileEntry.file(
		function(dataFile) 
		{
			fileReader = new FileReader();

			fileReader.onload = 
				function(event) 
				{ 
			    	var data = event.target.result;
		        	var dataObj = JSON.parse(data);

		        	loadBooks(dataObj);
		        	loadBookSections(dataObj);

		        	loadSections(dataObj);
		        	loadSectionRecipes(dataObj);

		        	loadRecipes(dataObj);
		        };  

			fileReader.readAsText(dataFile, "UTF-8");
		});
}

function loadDataFailed(error)
{
}

function loadData()
{
	chrome.syncFileSystem.requestFileSystem(
		function (fs) 
		{
	  	 	fs.root.getFile('/RecipeManager.json', 
	  	 		{ create: false }, 
	  	 		loadDataSuccess, 
	  	 		loadDataFailed);
		});
}

function onLoadDataClick()
{
	loadData();
}

function onTitleClick()
{
	var sidebarDiv = $("#sidebar");
	var sidebarWidth = sidebarDiv.width();

	if (_sidebarVisible)
	{
		sidebarDiv.css("margin-left", "-" + sidebarWidth + "px");

		_sidebarVisible = false;
		return;
	}

	sidebarDiv.css("margin-left", "0px");

	_sidebarVisible = true;
}

function onPrevMonthClick()
{
	if (_currDate.month == 0)
	{
		_currDate.year--;
		_currDate.month = 11;
	}
	else
	{
		_currDate.month--;
	}

	fillCalendarView(_currDate);
}

function onNextMonthClick()
{
	if (_currDate.month == 11)
	{
		_currDate.year++;
		_currDate.month = 0;
	}
	else
	{
		_currDate.month++;
	}

	fillCalendarView(_currDate);
}

function getCurrentMonth()
{
	var date = new Date();

	return {
		month: date.getMonth(),
		year: date.getFullYear()
	}
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

function fillCalendarView(date)
{
	var monthName = getMonthName(date.month);

	var monthTitleDiv = $("#currMonth");
	monthTitleDiv.text(monthName);

	var yearDiv = $("#year");
	yearDiv.text(date.year);

	var daysDiv = $("#days");
	daysDiv.empty();

	var firstDay = getDayOfWeek(1, date.month, date.year);
	for (var cnt = 0; cnt < firstDay; cnt++)
	{
		daysDiv.append("<div class='dummyDay'>&nbsp</div>");
	}

	var days = getDaysInMonth(month);
	for (var cnt = 0; cnt < days; cnt++)
	{
		var day = cnt + 1;
		daysDiv.append("<div class='dayCell'><div class='day'>" + day + "</div></div>");
	}

	var lastDay = getDayOfWeek(days, date.month, date.year);
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

function showSearchResults(results)
{
	clearSearchResults();
	showResultsView(true);

	if (results.books)
	{
		addResultsSection("Books", RESULT_TYPE_BOOK, results.books)
	}

	if (results.sections)
	{
		addResultsSection("Sections", RESULT_TYPE_SECTION, results.sections)
	}

	if (results.recipes)
	{
		addResultsSection("Recipes", RESULT_TYPE_RECIPE, results.recipes)
	}
}

function clearSearchResults()
{
	var resultsDiv = $("#results");
	resultsDiv.empty();
}

function addResultsSection(name, type, entries)
{
	var sectionDiv = $("<div class='resultSection'></div>");
	sectionDiv.append("<div class='sectionTitle'>" + name + "</div>");

	var size = entries.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var entry = entries[cnt];
		addResultEntry(sectionDiv, type, entry)
	}

	var resultsDiv = $("#results");
	resultsDiv.append(sectionDiv);
}

function addResultEntry(sectionDiv, type, entry)
{
	var entryDiv = $("<div class='result'>" + entry.name + "</div>");
	entryDiv.on("click", 
		function()
		{
			onSearchResultClick(type, entry.id);
		});

	sectionDiv.append(entryDiv);
}

function onSearchResultClick(type, id)
{
	switch (type)
	{
		case RESULT_TYPE_BOOK:
			showBookSections(id);
			return;

		case RESULT_TYPE_SECTION:
			showSectionRecipes(id);
			return;
	}
}

function showBooks()
{
	var results = { books: _db.books };
   	showSearchResults(results);
}

function showBookSections(id)
{
	var book = getBookByID(id);
	var results = { sections: [] };

	var size = book.sections.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var sectionID = book.sections[cnt];
		var section = getSectionByID(sectionID);

		if (section != null)
			results.sections.push(section);
	}

	showSearchResults(results);
}

function showSectionRecipes(id)
{
	var section = getSectionByID(id);
	var results = { recipes: [] };

	var size = section.recipes.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipeID = section.recipes[cnt];
		var recipe = getRecipeByID(recipeID);

		if (section != null)
			results.recipes.push(recipe);
	}

	showSearchResults(results);
}