var _currDate = 0;
var _currentResults = null;
var _sidebarVisible = false;
var _currentSearchText = "";

var _db = 
	{ 
		books: [], 
		sections: [],
		recipes: [],
		tags: []
	};

function Recipe()
{
	this.id = 0;
	this.sectionId = null;
	this.name = "";
	this.page = "";
	this.isCooked = false;
	this.isInteresting = false;
	this.comment = "";
	this.tagIds = [];
}

function Book()
{
	this.id = 0,
	this.name = "";
	this.sectionIds = [];
}

function Section()
{
	this.id = 0;
	this.name = "";
	this.recipeIds = [];
	this.tagIds = [];
}

function Tag()
{
	this.id = 0;
	this.name = "";
	this.recipeIds = [];
	this.sectionIds = [];
}

var RESULT_TYPE_BOOK 	= 1;
var RESULT_TYPE_SECTION = 2;
var RESULT_TYPE_RECIPE	= 3;
var RESULT_TYPE_TAG		= 4;

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
	$("#searchBox").keydown(
		function(event)
		{
    		if(event.keyCode == 13)
        		onSearchBoxChanged();
		});

	$("#title").on("click", onTitleClick);
	$("#prevMonth").on("click", onPrevMonthClick);
	$("#nextMonth").on("click", onNextMonthClick);
	$("#loadData").on("click", onLoadDataClick);
	$("#saveData").on("click", onSaveDataClick);
	$("#books").on("click", showBooks);
	$("#tags").on("click", showTags);

	var recipeView = $("#recipe");

	recipeView.find(".btnEdit").on("click", onRecipeEditClick);
	recipeView.find(".btnClose, .closeButton").on("click", onRecipeCloseClick);

	var sectionView = $("#section");

	sectionView.find(".btnEdit").on("click", onSectionEditClick);
	sectionView.find(".btnClose, .closeButton").on("click", onSectionCloseClick);

	var bookView = $("#book");

	bookView.find(".btnEdit").on("click", onBookEditClick);
	bookView.find(".btnClose, .closeButton").on("click", onBookCloseClick);

	var tagView = $("#tag");

	tagView.find(".btnEdit").on("click", onTagEditClick);
	tagView.find(".btnClose, .closeButton").on("click", onTagCloseClick);
}

function showLoadingView(show)
{
	var resultsDiv = $("#results");
	var loadingDiv = $("#loading");
	var calendarDiv = $("#calendar");

	if (show == true)
	{
		resultsDiv.hide();
		calendarDiv.hide();

		loadingDiv.css("display", "flex");
		return;
	}

	resultsDiv.show();
	loadingDiv.hide();
	calendarDiv.hide();
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

function getBookResults(searchText)
{
	var bookResults = [];

	var size = _db.books.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var book = _db.books[cnt];
		var bookName = book.name.toLowerCase();

		if (bookName.indexOf(searchText) == -1)
			continue;

		bookResults.push(book);
	}

	if (bookResults.length == 0)
		return null;

	return bookResults;
}

function getSectionResults(searchText)
{
	var sectionResults = [];

	var size = _db.books.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var section = _db.sections[cnt];
		var sectionName = section.name.toLowerCase();
		
		if (sectionName.indexOf(searchText) == -1)
			continue;

		sectionResults.push(section);
	}

	if (sectionResults.length == 0)
		return null;

	return sectionResults;
}

function getRecipeResults(searchText)
{
	var recipeResults = [];

	var size = _db.recipes.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipe = _db.recipes[cnt];
		var recipeName = recipe.name.toLowerCase();
		
		if (recipeName.indexOf(searchText) == -1)
			continue;

		recipeResults.push(recipe);
	}

	if (recipeResults.length == 0)
		return null;

	return recipeResults;
}

function getSearchResults(searchText)
{
	searchText = searchText.toLowerCase();

	var bookResults = getBookResults(searchText);
	var sectionResults = getSectionResults(searchText);
	var recipeResults = getRecipeResults(searchText);
	
	var results = 
	{ 
		books: bookResults,
		sections: sectionResults,
		recipes: recipeResults
	};

	return results;
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

	if (_currentSearchText == searchText)
		return;

	showLoadingView(true);
	_currentSearchText = searchText;

	chrome.runtime.sendMessage(
    	{
    		command: "search",
    		searchText: searchText,
    		db: _db
    	}, 
    	function(response) 
	    {
	    	console.log("Search reply.");
	    	showSearchResults(response);
		});

	var results = getSearchResults(searchText);

	showSearchResults(results);
}

function getObjectById(id, type)
{
	var array = null;

	switch (type)
	{
		case RESULT_TYPE_RECIPE:
			array = _db.recipes;
			break;

		case RESULT_TYPE_SECTION:
			array = _db.sections;
			break;

		case RESULT_TYPE_BOOK:
			array = _db.books;
			break;

		case RESULT_TYPE_TAG:
			array = _db.tags;
			break;
	}

	var size = array.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var object = array[cnt];

		if (object.id == id)
			return object;
   	}

   	return null;
}

function getBookById(id)
{
	var size = _db.books.length;
	for (var cnt = 0; cnt < size; cnt++) 
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
	for (var cnt = 0; cnt < size; cnt++) 
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
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var recipe = _db.recipes[cnt];

		if (recipe.id == id)
			return recipe;
   	}

   	return null;
}

function getTagById(id)
{
	var size = _db.tags.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var tag = _db.tags[cnt];

		if (tag.id == id)
			return tag;
   	}

   	return null;
}

function getTagControlById(parent, id)
{
	var tagControls = parent.find(".tagControl").children();

	var size = tagControls.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var tagControl = $(tagControls[cnt]);

		if (tagControl.data("id") == id)
			return tagControl;
   	}

   	return null;
}

function loadBooks(dataObj)
{
	var bookTable = dataObj.objects[1];

	for (var cnt = 0; cnt < bookTable.rows.length; cnt++) 
	{
		var book = bookTable.rows[cnt];

		var newBook = new Book();
		newBook.id = book[0];
		newBook.name = book[1];

		_db.books.push(newBook);
   	}
}

function loadSections(dataObj)
{
	var sectionTable = dataObj.objects[2];

	for (var cnt = 0; cnt < sectionTable.rows.length; cnt++) 
	{
		var section = sectionTable.rows[cnt];

		var newSection = new Section();
		newSection.id = section[0];
		newSection.bookId = null;
		newSection.name = section[1];

		_db.sections.push(newSection);
   	}
}

function loadRecipes(dataObj)
{
	var recipeTable = dataObj.objects[3];

	for (var cnt = 0; cnt < recipeTable.rows.length; cnt++) 
	{
		var recipe = recipeTable.rows[cnt];

		var newRecipe = new Recipe();
		newRecipe.id = recipe[0];
		newRecipe.sectionId = null;
		newRecipe.name = recipe[1];
		newRecipe.page = recipe[2];
		newRecipe.isCooked = recipe[3];
		newRecipe.isInteresting = recipe[4];
		newRecipe.comment = recipe[5];

		_db.recipes.push(newRecipe);
   	}
}

function loadTags(dataObj)
{
	var tagTable = dataObj.objects[0];

	for (var cnt = 0; cnt < tagTable.rows.length; cnt++) 
	{
		var tag = tagTable.rows[cnt];

		var newTag = new Tag();
		newTag.id = tag[0];
		newTag.name = tag[1];

		_db.tags.push(newTag);
   	}
}

function loadRecipesTags(dataObj)
{
	var recipeTagTable = dataObj.objects[5];

	var size = recipeTagTable.rows.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var recipeTag = recipeTagTable.rows[cnt];
		var recipe = getRecipeById(recipeTag[0]);

		if (recipe != null)
			recipe.tagIds.push(recipeTag[1]);

		var tag = getTagById(recipeTag[1]);

		if (tag != null)
			tag.recipeIds.push(recipeTag[0]);
   	}
}

function loadSectionTags(dataObj)
{
	var sectionTagTable = dataObj.objects[4];

	var size = sectionTagTable.rows.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var sectionTag = sectionTagTable.rows[cnt];
		var section = getSectionById(sectionTag[0]);

		if (section != null)
		{
			section.tagIds.push(sectionTag[1]);
			setTagInSectionRecipes(section, sectionTag[1]);
		}	

		var tag = getTagById(sectionTag[1]);

		if (tag != null)
			tag.sectionIds.push(sectionTag[0]);
   	}
}

function loadSectionRecipes(dataObj)
{
	var sectionRecipeTable = dataObj.objects[6];

	var size = sectionRecipeTable.rows.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var sectionRecipe = sectionRecipeTable.rows[cnt];
		var section = getSectionById(sectionRecipe[0]);

		if (section != null)
			section.recipeIds.push(sectionRecipe[1]);

		var recipe = getRecipeById(sectionRecipe[1]);

		if (recipe != null)
			recipe.sectionId = sectionRecipe[0];
   	}
}

function loadBookSections(dataObj)
{
	var bookSectionTable = dataObj.objects[7];

	var size = bookSectionTable.rows.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var bookSection = bookSectionTable.rows[cnt];
		var book = getBookById(bookSection[0]);

		if (book != null)
			book.sectionIds.push(bookSection[1]);

		var section = getSectionById(bookSection[1]);

		if (section != null)
			section.bookId = bookSection[0];
   	}
}

function onDBFileFound(dataFileEntry)
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

					_db = 
						{ 
							books: [], 
							sections: [],
							recipes: [],
							tags: []
						};

		        	loadTags(dataObj);
		        	loadBooks(dataObj);
		        	loadRecipes(dataObj);
		        	loadSections(dataObj);

		        	loadRecipesTags(dataObj);
		        	loadBookSections(dataObj);
		        	loadSectionRecipes(dataObj);

		        	loadSectionTags(dataObj);

		        	fillTagContainers();
		        };  

			fileReader.readAsText(dataFile, "UTF-8");
		});
}

function setTagInSectionRecipes(tagId, sectionId)
{
	var section = getSectionById(sectionId);

	if (section == null)
	{
		console.log("Section " + sectionId + " does not exist!");
		return;
	}

	var size = section.recipeIds.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var recipe = getRecipeById(section.recipeIds[cnt]);
		recipe.tagIds.push(tagId);
	}
}

function onFileNotFound(error)
{
}

function loadData()
{
	chrome.syncFileSystem.requestFileSystem(
		function (fs) 
		{
	  	 	fs.root.getFile('RecipeManager-OldDB.json', 
	  	 		{ create: false }, 
	  	 		onDBFileFound, 
	  	 		onFileNotFound);
		});
}

function onLoadDataClick()
{
	loadData();
}

function onSaveFileFound(dataFileEntry)
{
	function replacer(key, value)
	{
		switch (key)
		{
			case "sectionIds":
			case "recipeIds":
				return undefined;
		}

		return value;
	}

	var jsonString = JSON.stringify(_db, replacer);
	var jsonBlob = new Blob([jsonString]);

	dataFileEntry.createWriter(
		function(writer) 
		{
			var truncated = false;

			writer.onerror = 
				function(e)
				{
	      		  console.log("Write failed: " + e.toString());
	      		};

      		writer.onwriteend = 
      			function(e) 
      			{
      				if (!truncated)
      				{
						this.truncate(jsonBlob.size);
						truncated = true;

						return;
		      		}

		      		console.log("Write success!. New size: " + jsonBlob.size);
        		}

			writer.write(jsonBlob);
		});
}

function onSaveDataClick()
{
	chrome.syncFileSystem.requestFileSystem(
		function (fs) 
		{
	  	 	fs.root.getFile('RecipeManager-new.json', 
	  	 		{ create: true }, 
	  	 		onSaveFileFound, 
	  	 		onFileNotFound);
		});
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
	_currentResults = results;

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

	if (results.tags)
	{
		addResultsSection("Tags", RESULT_TYPE_TAG, results.tags)
	}

	showLoadingView(false);
}

function clearSearchResults()
{
	var resultsDiv = $("#results");
	resultsDiv.empty();
}

function addResultsSection(name, type, entries)
{
	var sectionDiv = $("<div class='resultSection'></div>");
	var sectionHeader = $("<div class='sectionHeader'></div>");

	sectionDiv.append(sectionHeader);
	sectionHeader.append("<div class='sectionTitle'>" + name + "</div>");
	sectionHeader.append("<div class='sectionAdd'>+</div>");

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

		case RESULT_TYPE_TAG:
			addTagResults(sectionDiv, entries);
			return;
	}
}

function addBookResults(sectionDiv, entries)
{
	sortBooks(entries);

	var sectionAdd = sectionDiv.find(".sectionAdd");

	sectionAdd.css("display", "flex");

	sectionAdd.off("click");
	sectionAdd.on("click",
		function(e)
		{
			onAddClick(RESULT_TYPE_BOOK);
			e.stopPropagation();
		});

	var size = entries.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var book = entries[cnt];
		var entryDiv = $("<div class='resultEntry'>" + book.name + "</div>");

		if (book.id == 0)
			entryDiv.addClass("addNewEntry");

		addResultEntry(sectionDiv, RESULT_TYPE_BOOK, book, entryDiv);
	}
}

function addSectionResults(sectionDiv, entries)
{
	var sectionGroups = [];
	groupSectionsByBook(entries, sectionGroups);

	var sectionAdd = sectionDiv.find(".sectionAdd");

	if (sectionGroups.length > 1)
	{
		sectionAdd.hide();
	}
	else
	{
		sectionAdd.css("display", "flex");

		var sectionGroup = sectionGroups[0];

		sectionAdd.off("click");
		sectionAdd.on("click",
			function(e)
			{
				onAddClick(RESULT_TYPE_SECTION, sectionGroup.bookId);
				e.stopPropagation();
			});
	}
		
	var groups = sectionGroups.length;
	for (var i = 0; i < groups; i++)
	{
		var sectionGroup = sectionGroups[i];
		addSectionResultPath(sectionDiv, sectionGroup.bookId);

		sortSections(sectionGroup.sections);

		var sections = sectionGroup.sections.length;
		for (var j = 0; j < sections; j++)
		{
			var section = sectionGroup.sections[j];
			var entryDiv = $("<div class='resultEntry'>" + section.name + "</div>");

			if (section.id == 0)
				entryDiv.addClass("addNewEntry");

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

	var sectionAdd = sectionDiv.find(".sectionAdd");

	if (recipeGroups.length > 1)
	{
		sectionAdd.hide();
	}
	else
	{
		sectionAdd.css("display", "flex");

		var recipeGroup = recipeGroups[0];

		sectionAdd.off("click");
		sectionAdd.on("click",
			function(e)
			{
				onAddClick(RESULT_TYPE_RECIPE, recipeGroup.sectionId);
				e.stopPropagation();
			});
	}
	
	var groups = recipeGroups.length;
	for (var i = 0; i < groups; i++)
	{
		var recipeGroup = recipeGroups[i];
		addRecipeResultPath(sectionDiv, recipeGroup.sectionId);
		
		sortRecipes(recipeGroup.recipes);

		var recipes = recipeGroup.recipes.length;
		for (var j = 0; j < recipes; j++)
		{
			var recipe = recipeGroup.recipes[j];
			addRecipeResult(sectionDiv, recipe);

			if (j == 50)
				break;
		}	

		if (i == 10)
			break;
	}
}

function addRecipeResult(sectionDiv, recipe)
{
	var entryDiv = $("<div class='resultEntry'></div>");
	entryDiv.append("<div class='recipeName'>" + recipe.name + "</div>");

	if (recipe.id == 0)
	{
		entryDiv.addClass("addNewEntry");
	}
	else
	{
		var recipeInfo = "pg. " + recipe.page;

		if (recipe.isCooked == true)
			recipeInfo += "; Cooked";

		if (recipe.isInteresting == true)
			recipeInfo += "; Interesting";

		entryDiv.append("<div class='recipeInfo'>" + recipeInfo + "</div>");
	}

	addResultEntry(sectionDiv, RESULT_TYPE_RECIPE, recipe, entryDiv);
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

function addTagResults(sectionDiv, entries)
{
	sortTags(entries);

	var sectionAdd = sectionDiv.find(".sectionAdd");

	sectionAdd.css("display", "flex");

	sectionAdd.off("click");
	sectionAdd.on("click",
		function(e)
		{
			onAddClick(RESULT_TYPE_TAG);
			e.stopPropagation();
		});

	var size = entries.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var tag = entries[cnt];
		var entryDiv = $("<div class='resultEntry'>" + tag.name + "</div>");

		addResultEntry(sectionDiv, RESULT_TYPE_TAG, tag, entryDiv);
	}
}

function addResultEntry(sectionDiv, type, entry, entryDiv)
{
	var resultDiv = $("<div class='result'></div>");
	resultDiv.append(entryDiv);

	if (entryDiv.hasClass("addNewEntry"))
	{
		resultDiv.on("click", 
			function()
			{
				var sectionAdd = sectionDiv.find(".sectionAdd");
				sectionAdd.click();
			});
	}
	else
	{
		addEditButton(resultDiv, type, entry.id);
		addDeleteButton(resultDiv, type, entry.id);
	
		resultDiv.on("click", 
			function()
			{
				onSearchResultClick(type, entry.id);
			});
	}

	sectionDiv.append(resultDiv);
}

function addEditButton(resultDiv, type, id)
{
	var editButton = $("<div class='resultButtons'>e</div>");

	editButton.on("click", 
		function(e)
		{
			onEditClick(type, id);
			e.stopPropagation();
		});

	resultDiv.append(editButton);
}

function addDeleteButton(resultDiv, type, id)
{
	var deleteButton = $("<div class='resultButtons'>x</div>");

	deleteButton.on("click", 
		function(e)
		{
			onDeleteClick(type, id);
			resultDiv.remove();

			e.stopPropagation();
		});

	resultDiv.append(deleteButton);
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

		case RESULT_TYPE_RECIPE:
			showRecipe(id);
			return;

		case RESULT_TYPE_TAG:
			showTagRecipes(id);
			return;
	}
}

function showBooks()
{
	var results = { books: _db.books };

	if (results.books.length == 0)
	{
		var book = new Book();
		book.name = "Add book...";

		results.books.push(book);
	}

   	showSearchResults(results);
}

function showBookSections(id)
{
	var book = getBookById(id);
	var results = { sections: [] };

	var size = book.sectionIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var sectionID = book.sectionIds[cnt];
		var section = getSectionById(sectionID);

		if (section != null)
			results.sections.push(section);
	}

	if (results.sections.length == 0)
	{
		var section = new Section();

		section.bookId = id;
		section.name = "Add section...";

		results.sections.push(section);
	}

	showSearchResults(results);
}

function showSectionRecipes(id)
{
	var section = getSectionById(id);
	var results = { recipes: [] };

	var size = section.recipeIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipeID = section.recipeIds[cnt];
		var recipe = getRecipeById(recipeID);

		if (recipe != null)
			results.recipes.push(recipe);
	}

	if (results.recipes.length == 0)
	{
		var recipe = new Recipe();

		recipe.sectionId = id;
		recipe.name = "Add recipe...";

		results.recipes.push(recipe);
	}

	showSearchResults(results);
}

function showRecipe(id, parentId)
{
	resetRecipeView();

	var recipe = getRecipeById(id);
	var recipeView = $("#recipe");

	if (recipe == null)
	{
		recipe = new Recipe();
		recipe.id = id;
		recipe.sectionId = parentId;

		var section = getSectionById(parentId);
		recipe.tagIds = section.tagIds;

		onRecipeEditClick();
	}

	recipeView.find("#titleCtrl").val(recipe.name);
	recipeView.find("#pageCtrl").val(recipe.page);
	recipeView.find("#cookedCtrl").prop("checked", recipe.isCooked);
	recipeView.find("#interestingCtrl").prop("checked", recipe.isInteresting);
	recipeView.find("#commentCtrl").val(recipe.comment);

	checkTags(recipeView, recipe.tagIds);

	var btnOK = recipeView.find(".btnOK");
	btnOK.off("click");

	btnOK.on("click", 
		function()
		{
			onRecipeOKClick(id, recipe);
		})

	var btnCancel = recipeView.find(".btnCancel");
	btnCancel.off("click");

	btnCancel.on("click", 
		function()
		{
			showRecipe(id, parentId);
		})

	recipeView.css("display", "flex");
}

function showTagRecipes(id)
{
	var tag = getTagById(id);
	var results = { recipes: [] };

	var size = tag.recipeIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipeID = tag.recipeIds[cnt];
		var recipe = getRecipeById(recipeID);

		if (recipe != null)
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

function sortBooks(books)
{
	books.sort(
		function(a, b)
		{
			if (a.name < b.name)
				return -1;

			if (a.name == b.name)
				return 0;

			return 1;
		});
}

function sortSections(sections)
{
	sections.sort(
		function(a, b)
		{
			if (a.name < b.name)
				return -1;

			if (a.name == b.name)
				return 0;

			return 1;
		});
}

function sortRecipes(recipes)
{
	recipes.sort(
		function(a, b)
		{
			if (a.page < b.page)
				return -1;

			if (a.page == b.page)
				return 0;

			return 1;
		});
}

function sortTags(tags)
{
	tags.sort(
		function(a, b)
		{
			if (a.name < b.name)
				return -1;

			if (a.name == b.name)
				return 0;

			return 1;
		});
}

function showTags()
{
	var results = { tags: _db.tags };
   	showSearchResults(results);
}

function onRecipeCloseClick()
{
	$("#recipe").hide();
	resetRecipeView();
}

function onRecipeOKClick(id, newRecipe)
{
	var recipe = getRecipeById(id);

	if (recipe == null)
	{
		recipe = newRecipe;

		var section = getSectionById(recipe.sectionId);

		section.recipeIds.push(id);
		_db.recipes.push(recipe);
	}

	var recipeView = $("#recipe");

	recipe.name = recipeView.find("#titleCtrl").val();
	recipe.page = recipeView.find("#pageCtrl").val();
	recipe.isCooked = recipeView.find("#cookedCtrl").prop("checked");
	recipe.isInteresting = recipeView.find("#interestingCtrl").prop("checked");
	recipe.comment = recipeView.find("#commentCtrl").val();

	recipe.tagIds = getCheckedTagIds(recipeView);

	updateTagRecipeReferences(recipe);

	recipeView.hide();
	resetRecipeView();

	refreshResultsView();
}

function resetRecipeView()
{
	var recipeView = $("#recipe");

	recipeView.find("#cookedCtrl, #interestingCtrl").attr("disabled", true);
	recipeView.find("#titleCtrl, #pageCtrl, #commentCtrl").attr("readonly", true);

	recipeView.find(".btnEdit, .btnClose").show();
	recipeView.find(".btnOK, .btnCancel").hide();

	var allTagControls = recipeView.find(".tagControl").children();

	allTagControls.attr("disabled", true);
	allTagControls.prop("checked", false);		
}

function onRecipeEditClick()
{
	var recipeView = $("#recipe");

	recipeView.find("#cookedCtrl, #interestingCtrl").removeAttr("disabled");
	recipeView.find("#titleCtrl, #pageCtrl, #commentCtrl").removeAttr("readonly");

	recipeView.find(".tagControl").children().removeAttr("disabled");

	recipeView.find(".btnOK, .btnCancel").show();
	recipeView.find(".btnEdit, .btnClose").hide();

	recipeView.find("#titleCtrl").focus();
}

function fillTagContainers()
{
	var tagContainer = $(".tagContainer");

	var tagLabels = tagContainer.find(".tagLabels");
	var tagControls = tagContainer.find(".tagControls");

	tagLabels.empty();
	tagControls.empty();

	sortTags(_db.tags);

	var size = _db.tags.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var tag = _db.tags[cnt];

		var tagLabel = $("<div class='tagLabel'>" + tag.name + "</div>");
		var tagControlDiv = $("<div class='tagControl'></div>");
		var tagControl = $("<input type='checkbox' disabled/>");

		tagControlDiv.append(tagControl);
		tagControl.data("id", tag.id);

		tagLabels.append(tagLabel);
		tagControls.append(tagControlDiv);
	}
}

function checkTags(parent, tagIds)
{
	var size = tagIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var tagControl = getTagControlById(parent, tagIds[cnt]);

		if (tagControl == null)
			continue;

		tagControl.prop("checked", true);
	}
}

function getCheckedTagIds(parent)
{
	var checkedTagIds = [];
	var tagControls = parent.find(".tagControl").children();

	var size = tagControls.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var tagControl = $(tagControls[cnt]);
		
		if (!tagControl.prop("checked"))
			continue;

		checkedTagIds.push(tagControl.data("id"));
   	}

   	return checkedTagIds;
}

function filterRecipeSectionTagIds(tagIds, sectionId)
{
	var filteredTags = [];
	var section = getSectionById(sectionId);

	var size = tagIds.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var tagId = tagIds[cnt];

		if (section.tagIds.indexOf(tagId) == -1)
			continue;

		filteredTags.push(tagId);
	}

	return filteredTags;
}

function isSectionTag(sectionId, tagId)
{
	var section = getSectionById(sectionId);

	if (section.tagIds.indexOf(tagId) == -1)
		return false;

	return true;
}

function removeRecipeFromTag(tag, recipeId)
{
	var index = tag.recipeIds.indexOf(recipeId)

	if (index == -1)
		return;

    tag.recipeIds.splice(index, 1);
}

function addRecipeToTag(tag, recipeId)
{
	var index = tag.recipeIds.indexOf(recipeId)

	if (index != -1)
		return;

    tag.recipeIds.push(recipeId);
}

function updateTagRecipeReferences(recipe)
{
	var size = _db.tags.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var tag = _db.tags[cnt];

		if (isSectionTag(recipe.sectionId, tag.id))
			continue;

		if (recipe.tagIds.indexOf(tag.id) == -1)
		{
			removeRecipeFromTag(tag, recipe.id);
		}
		else
		{
			addRecipeToTag(tag, recipe.id);
		}
	}
}

function showSection(id, parentId)
{
	resetSectionView();

	var section = getSectionById(id);

	if (section == null)
	{
		section = new Section();
		section.id = id;
		section.bookId = parentId;

		onSectionEditClick();
	}

	var sectionView = $("#section");

	sectionView.find("#titleCtrl").val(section.name);
	checkTags(sectionView, section.tagIds);

	var btnOK = sectionView.find(".btnOK");
	btnOK.off("click");

	btnOK.on("click", 
		function()
		{
			onSectionOKClick(id, section);
		})

	var btnCancel = sectionView.find(".btnCancel");
	btnCancel.off("click");

	btnCancel.on("click", 
		function()
		{
			showSection(id, parentId);
		})

	sectionView.css("display", "flex");
}

function onSectionOKClick(id, newSection)
{
	var section = getSectionById(id);

	if (section == null)
	{
		section = newSection;

		var book = getBookById(section.bookId);

		book.sectionIds.push(id);
		_db.sections.push(section);
	}

	var sectionView = $("#section");
	section.name = sectionView.find("#titleCtrl").val();

	var tagIdDiff = getCheckedTagsDiff(sectionView, section.tagIds);
	section.tagIds = getCheckedTagIds(sectionView);

	var size = section.recipeIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipeId = section.recipeIds[cnt];
		var recipe = getRecipeById(recipeId);

		for (var j = 0; j < tagIdDiff.added.length; j++)
		{
			var tagId = tagIdDiff.added[j];
			var index = recipe.tagIds.indexOf(tagId);

			if (index != -1)
				continue;

			recipe.tagIds.push(tagId);
		}

		for (var j = 0; j < tagIdDiff.removed.length; j++)
		{
			var tagId = tagIdDiff.added[j];
			var index = recipe.tagIds.indexOf(tagId);

			if (index == -1)
				continue;

			recipe.tagIds.splice(index, 1);
		}
		
		updateTagRecipeReferences(recipe);
	}

	sectionView.hide();
	resetSectionView();

	refreshResultsView();
}

function resetSectionView()
{
	var sectionView = $("#section");

	sectionView.find("#titleCtrl").attr("readonly", true);

	sectionView.find(".btnEdit, .btnClose").show();
	sectionView.find(".btnOK, .btnCancel").hide();

	var allTagControls = sectionView.find(".tagControl").children();

	allTagControls.attr("disabled", true);
	allTagControls.prop("checked", false);		
}

function onSectionEditClick()
{
	var sectionView = $("#section");

	sectionView.find("#titleCtrl").removeAttr("readonly");
	sectionView.find(".tagControl").children().removeAttr("disabled");

	sectionView.find(".btnOK, .btnCancel").show();
	sectionView.find(".btnEdit, .btnClose").hide();

	sectionView.find("#titleCtrl").focus();
}

function onSectionCloseClick()
{
	$("#section").hide();
	resetSectionView();
}

function getCheckedTagsDiff(parent, oldTagIds)
{
	var tagsDiff = 
	{
		added: [],
		removed: []
	};

	var tagControls = parent.find(".tagControl").children();

	var size = tagControls.length;
	for (var cnt = 0; cnt < size; cnt++) 
	{
		var tagControl = $(tagControls[cnt]);
		var tagId = tagControl.data("id");

		if (tagControl.prop("checked") && oldTagIds.indexOf(tagId) == -1)
		{
			tagsDiff.added.push(tagId);
		}
		else if (!tagControl.prop("checked") && oldTagIds.indexOf(tagId) != -1)
		{
			tagsDiff.removed.push(tagId);
		}
   	}

   	return tagsDiff;
}

function showBook(id)
{
	resetBookView();

	var book = getBookById(id);

	if (book == null)
	{
		book = new Book();
		book.id = id;

		onBookEditClick();
	}

	var bookView = $("#book");
	bookView.find("#titleCtrl").val(book.name);

	var btnOK = bookView.find(".btnOK");
	btnOK.off("click");

	btnOK.on("click", 
		function()
		{
			onBookOKClick(id, book);
		})

	var btnCancel = bookView.find(".btnCancel");
	btnCancel.off("click");

	btnCancel.on("click", 
		function()
		{
			showBook(id);
		})

	bookView.css("display", "flex");
}

function resetBookView()
{
	var bookView = $("#book");

	bookView.find("#titleCtrl").attr("readonly", true);

	bookView.find(".btnEdit, .btnClose").show();
	bookView.find(".btnOK, .btnCancel").hide();
}

function onBookEditClick()
{
	var bookView = $("#book");

	bookView.find("#titleCtrl").removeAttr("readonly");

	bookView.find(".btnOK, .btnCancel").show();
	bookView.find(".btnEdit, .btnClose").hide();

	bookView.find("#titleCtrl").focus();
}

function onBookCloseClick()
{
	$("#book").hide();
	resetBookView();
}

function onBookOKClick(id, newBook)
{
	var book = getBookById(id);

	if (book == null)
	{
		book = newBook;
		_db.books.push(book);
	}

	var bookView = $("#book");
	book.name = bookView.find("#titleCtrl").val();

	bookView.hide();
	resetBookView();

	refreshResultsView();
}

function onEditClick(type, id)
{
	switch (type)
	{
		case RESULT_TYPE_RECIPE:
			showRecipe(id);
			return;

		case RESULT_TYPE_SECTION:
			showSection(id);
			return;

		case RESULT_TYPE_BOOK:
			showBook(id);
			return;

		case RESULT_TYPE_TAG:
			showTag(id);
			return;
	}
}

function onDeleteClick(type, id)
{
	switch (type)
	{
		case RESULT_TYPE_RECIPE:
			deleteRecipe(id);
			return;

		case RESULT_TYPE_SECTION:
			deleteSection(id);
			return;

		case RESULT_TYPE_BOOK:
			deleteBook(id);
			return;
	}
}

function deleteRecipe(id, removeFromSection)
{
	var recipe = getRecipeById(id);

	if (recipe == null)
		return;

	recipe.tagIds.splice(0, recipe.tagIds.length);
	updateTagRecipeReferences(recipe);

	if (removeFromSection == true)
	{
		var sectionId = recipe.sectionId;
		var section = getSectionById(sectionId);

		var index = section.recipeIds.indexOf(id);

		if (index != -1)
			section.recipeIds.splice(index, 1);
	}
	
	var index = _db.recipes.indexOf(recipe);

	if (index != -1)
		_db.recipes.splice(index, 1);
}

function deleteSection(id, removeFromBook)
{
	var section = getSectionById(id);

	if (section == null)
		return;

	var size = section.recipeIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipeId = section.recipeIds[cnt];
		deleteRecipe(recipeId, false);
	}

	if (removeFromBook == true)
	{
		var bookId = section.bookId;
		var book = getBookById(bookId);
	
		var index = book.sectionIds.indexOf(id);

		if (index != -1)
			book.sectionIds.splice(index, 1);
	}

	var index = _db.sections.indexOf(section);

	if (index != -1)
		_db.sections.splice(index, 1);
}

function deleteBook(id)
{
	var book = getBookById(id);

	if (book == null)
		return;

	var size = book.sectionIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var sectionId = book.sectionIds[cnt];
		deleteSection(sectionId, false);
	}

	var index = _db.books.indexOf(book);

	if (index != -1)
		_db.books.splice(index, 1);
}

function refreshResultsView()
{
	showSearchResults(_currentResults);
}

function onAddClick(type, parentId)
{
	var id = getNextAvailableId(type);

	switch (type)
	{
		case RESULT_TYPE_RECIPE:
			showRecipe(id, parentId);
			return;

		case RESULT_TYPE_SECTION:
			showSection(id, parentId);
			return;

		case RESULT_TYPE_BOOK:
			showBook(id);
			return;

		case RESULT_TYPE_TAG:
			showTag(id);
			return;
	}
}

function getNextAvailableId(type)
{
	var array = null;

	switch (type)
	{
		case RESULT_TYPE_RECIPE:
			array = _db.recipes;
			break;

		case RESULT_TYPE_SECTION:
			array = _db.sections;
			break;

		case RESULT_TYPE_BOOK:
			array = _db.books;
			break;

		case RESULT_TYPE_TAG:
			array = _db.tags;
			break;
	}

	var id = array[array.length - 1].id + 1;
	var isIdAvailable = false;

	do
	{
		isIdAvailable = getObjectById(id, type) == null;
		id++;
	}
	while (!isIdAvailable);

	return id;
}

function showTag(id)
{
	resetTagView();

	var tag = getTagById(id);

	if (tag == null)
	{
		tag = new Tag();
		tag.id = id;

		onTagEditClick();
	}

	var tagView = $("#tag");
	tagView.find("#titleCtrl").val(tag.name);

	var btnOK = tagView.find(".btnOK");
	btnOK.off("click");

	btnOK.on("click", 
		function()
		{
			onTagOKClick(id, book);
		})

	var btnCancel = tagView.find(".btnCancel");
	btnCancel.off("click");

	btnCancel.on("click", 
		function()
		{
			showTag(id);
		})

	tagView.css("display", "flex");
}

function resetTagView()
{
	var tagView = $("#tag");

	tagView.find("#titleCtrl").attr("readonly", true);

	tagView.find(".btnEdit, .btnClose").show();
	tagView.find(".btnOK, .btnCancel").hide();
}

function onTagEditClick()
{
	var tagView = $("#tag");

	tagView.find("#titleCtrl").removeAttr("readonly");

	tagView.find(".btnOK, .btnCancel").show();
	tagView.find(".btnEdit, .btnClose").hide();

	tagView.find("#titleCtrl").focus();
}

function onTagCloseClick()
{
	$("#tag").hide();
	resetTagView();
}

function onTagOKClick(id, newTag)
{
	var tag = getTagById(id);

	if (tag == null)
	{
		tag = newTag;
		_db.books.push(tag);
	}

	var tagView = $("#tag");
	tag.name = tagView.find("#titleCtrl").val();

	tagView.hide();
	resetTagView();

	fillTagContainers();
	refreshResultsView();
}