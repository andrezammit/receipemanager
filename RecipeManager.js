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

function getBookById(id)
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

function getSectionById(id)
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

function getRecipeById(id)
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
			bookId: null,
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
			sectionId: null,
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
		var section = getSectionById(sectionRecipe[0]);

		if (section != null)
			section.recipes.push(sectionRecipe[1]);

		var recipe = getRecipeById(sectionRecipe[1]);

		if (recipe != null)
			recipe.sectionId = sectionRecipe[0];
   	}
}

function loadBookSections(dataObj)
{
	var bookSectionTable = dataObj.objects[7];

	var size = bookSectionTable.rows.length;
	for(var cnt = 0; cnt < size; cnt++) 
	{
		var bookSection = bookSectionTable.rows[cnt];
		var book = getBookById(bookSection[0]);

		if (book != null)
			book.sections.push(bookSection[1]);

		var section = getSectionById(bookSection[1]);

		if (section != null)
			section.bookId = bookSection[0];
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
		        	loadSections(dataObj);
		        	loadRecipes(dataObj);

		        	loadBookSections(dataObj);
		        	loadSectionRecipes(dataObj);
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

	addResults(sectionDiv, type, entries);

	var resultsDiv = $("#results");
	resultsDiv.append(sectionDiv);
}

function addResults(sectionDiv, type, entries)
{
	switch (type)
	{
		case RESULT_TYPE_BOOK:
			addBookResults(sectionDiv, entries);
			return;

		case RESULT_TYPE_SECTION:
			addSectionResults(sectionDiv, entries);
			return;

		case RESULT_TYPE_RECIPE:
			addRecipeResults(sectionDiv, entries);
			return;
	}
}

function addBookResults(sectionDiv, entries)
{
	var size = entries.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var book = entries[cnt];
		var entryDiv = $("<div class='result'>" + book.name + "</div>");

		addResultEntry(sectionDiv, RESULT_TYPE_BOOK, book, entryDiv);
	}
}

function addSectionResults(sectionDiv, entries)
{
	var sectionGroups = [];
	groupSectionsByBook(entries, sectionGroups);

	var groups = sectionGroups.length;
	for (var i = 0; i < groups; i++)
	{
		var sectionGroup = sectionGroups[i];
		addSectionResultPath(sectionDiv, sectionGroup.bookId);

		var sections = sectionGroup.sections.length;
		for (var j = 0; j < sections; j++)
		{
			var section = sectionGroup.sections[j];
			var entryDiv = $("<div class='result'>" + section.name + "</div>");

			addResultEntry(sectionDiv, RESULT_TYPE_SECTION, section, entryDiv);
		}	
	}
}

function addSectionResultPath(sectionDiv, bookId)
{
	var book = getBookById(bookId);

	var resultPathDiv = $("<div class='resultPath'></div>");

	var bookPathDiv = $("<div class='resultSubPath'>Book: " + book.name + "</div>");
	bookPathDiv.on("click", 
		function()
		{
			onSearchResultClick(RESULT_TYPE_BOOK, book.id);
		});


	resultPathDiv.append(bookPathDiv);

	sectionDiv.append(resultPathDiv);
}

function addRecipeResults(sectionDiv, entries)
{
	var recipeGroups = [];
	groupRecipesBySection(entries, recipeGroups);

	var groups = recipeGroups.length;
	for (var i = 0; i < groups; i++)
	{
		var recipeGroup = recipeGroups[i];
		addRecipeResultPath(sectionDiv, recipeGroup.sectionId);
		
		var recipes = recipeGroup.recipes.length;
		for (var j = 0; j < recipes; j++)
		{
			var recipe = recipeGroup.recipes[j];
			var entryDiv = $("<div class='result'>" + recipe.name + "</div>");

			addResultEntry(sectionDiv, RESULT_TYPE_RECIPE, recipe, entryDiv);
		}	
	}
}

function addRecipeResultPath(sectionDiv, sectionID)
{
	var section = getSectionById(sectionID);
	var book = getBookById(section.bookId);

	var resultPathDiv = $("<div class='resultPath'></div>");

	var bookPathDiv = $("<div class='resultSubPath'>Book: " + book.name + "</div>");
	bookPathDiv.on("click", 
		function()
		{
			onSearchResultClick(RESULT_TYPE_BOOK, book.id);
		});

	var sectionPathDiv = $("<div class='resultSubPath'>Section: " + section.name + "</div>");
		sectionPathDiv.on("click", 
		function()
		{
			onSearchResultClick(RESULT_TYPE_SECTION, section.id);
		});

	resultPathDiv.append(bookPathDiv);
	resultPathDiv.append(sectionPathDiv);

	sectionDiv.append(resultPathDiv);
}

function addResultEntry(sectionDiv, type, entry, entryDiv)
{
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
	var book = getBookById(id);
	var results = { sections: [] };

	var size = book.sections.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var sectionID = book.sections[cnt];
		var section = getSectionById(sectionID);

		if (section != null)
			results.sections.push(section);
	}

	showSearchResults(results);
}

function showSectionRecipes(id)
{
	var section = getSectionById(id);
	var results = { recipes: [] };

	var size = section.recipes.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipeID = section.recipes[cnt];
		var recipe = getRecipeById(recipeID);

		if (section != null)
			results.recipes.push(recipe);
	}

	showSearchResults(results);
}

function addSectionToSectionGroup(section, groups)
{
	var groupToAddTo = null;

	var size = groups.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var sectionGroup = groups[cnt];

		if (sectionGroup.bookId == section.bookId)
		{
			groupToAddTo = sectionGroup;
			break;
		}
	}

	if (groupToAddTo == null)
	{
		groupToAddTo = 
			{ 
				bookId: section.bookId,
				sections: [] 
			};

		groups.push(groupToAddTo);
	}

	groupToAddTo.sections.push(section);
}

function addRecipeToRecipeGroup(recipe, groups)
{
	var groupToAddTo = null;

	var size = groups.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipeGroup = groups[cnt];

		if (recipeGroup.sectionId == recipe.sectionId)
		{
			groupToAddTo = recipeGroup;
			break;
		}
	}

	if (groupToAddTo == null)
	{
		groupToAddTo = 
			{ 
				sectionId: recipe.sectionId,
				recipes: [] 
			};

		groups.push(groupToAddTo);
	}

	groupToAddTo.recipes.push(recipe);
}

function groupSectionsByBook(sections, groups)
{
	var size = sections.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		addSectionToSectionGroup(sections[cnt], groups);
	}
}

function groupRecipesBySection(recipes, groups)
{
	var size = recipes.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		addRecipeToRecipeGroup(recipes[cnt], groups);
	}
}