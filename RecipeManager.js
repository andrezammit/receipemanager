"use strict";

/* globals RESULT_TYPE_BOOK */
/* globals RESULT_TYPE_SECTION */
/* globals RESULT_TYPE_RECIPE */
/* globals RESULT_TYPE_TAG */

/* globals KEY_UP */
/* globals KEY_DOWN */
/* globals KEY_ENTER */

/* globals Recipe */
/* globals Book */
/* globals Section */
/* globals Tag */

var _currDate = 0;
var _currentResults = null;
var _sidebarVisible = false;
var _currentSearchText = "";

var _lastSectionId = -1;
var _currentResultsType = -1;
var _currentResultsDiv = null;

$(document).ready(
	function()
	{
		loadDatabase(
			function()
			{
				_currDate = getCurrentDate();

				fillCalendarView(_currDate);
				fillTagContainers();
			});
	    	
	    	setHandlers();
	});

function setHandlers()
{
	$("#searchBox")
		.on("input",
			function()
			{
	    		onSearchBoxChanged();
			})
		.on("click",
			function(event)
			{
	    		event.stopPropagation();
			})
		.keydown(
			function(event)
			{
				switch (event.keyCode)
				{
					case KEY_ENTER:
						onSearchBoxEnterPressed();
						break;

					case KEY_UP:
						onSearchBoxUpPressed();
						break;

					case KEY_DOWN:
						onSearchBoxDownPressed();
						break;
				}
			})
		.focusin(
			function(event)
			{
				$("#suggestions").show();
				event.stopPropagation();
			});

	$("#suggestions").focusout(
		function()
		{
			$("#suggestions").hide();
		});

	$("#header").on("click",
		function()
		{
			$("#suggestions").hide();
		});

	$("#container").on("click",
		function()
		{
			$("#suggestions").hide();
		});

	$("#calendarLink").on("click", onCalendarLinkClick);
	$("#title").on("click", onTitleClick);
	$("#prevMonth").on("click", onPrevMonthClick);
	$("#nextMonth").on("click", onNextMonthClick);
	$("#loadData").on("click", onLoadDataClick);
	//$("#saveData").on("click", onSaveDataClick);
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

	$(window).on("scroll", 
		function() 
		{
		    var yPos = window.pageYOffset;
		    var pageHeight = $("body").height();

		    var limitFromBottom = pageHeight * 0.75;
			    
		    if (yPos > limitFromBottom) 
		    {
		        chrome.runtime.sendMessage(
		    	{
		    		command: "getBunchOfResults",
		    	}, 
		    	function(response) 
			    {
			    	console.log("Search reply.");
			    	showSearchResults(response, false);
				});
    		}
	});
}

function showLoadingView(show)
{
	var resultsDiv = $("#results");
	var loadingDiv = $("#loading");
	var calendarDiv = $("#calendar");

	if (show === true)
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

	if (show === true)
	{
		resultsDiv.show();
		calendarDiv.hide();

		return;
	}

	resultsDiv.hide();
	calendarDiv.show();
}

function loadDatabase(onLoadDatabaseDone)
{
	chrome.runtime.sendMessage(
	{
		command: "loadDatabase",
	}, 
	function() 
    {
    	console.log("Database loaded.");

    	if (onLoadDatabaseDone !== null)
    		onLoadDatabaseDone();
	});
}

function onSearchBoxChanged()
{
	var searchBox = $("#searchBox");
	var searchText = searchBox.val();

	if (searchText === "")
	{
		$("#suggestions").empty();
		return;
	}

	chrome.runtime.sendMessage(
		{
			command: "getSearchSuggestions",
			searchText: searchText,
		}, 
		function(response) 
	    {
	    	showSearchSuggestions(response);
		});
}

function addSearchSuggestion(suggestionsDiv, tag)
{
	var suggestionDiv = $("<div class='suggestion'>#" + tag.name + "</div>");

	suggestionDiv.on("click",
		function()
		{
			var searchText = $("#searchBox").val();
			var index = searchText.lastIndexOf(",");

			if (index === -1)
			{
				searchText = "#" + tag.name;
			}
			else
			{
				searchText = searchText.substring(0, index);
				searchText += ", #" + tag.name;
			}

			$("#searchBox").val(searchText);

			suggestionsDiv.hide();
			suggestionsDiv.children().removeClass("suggestionHover");

			$("#searchBox").focus();
		});

	suggestionDiv.hover(
		function()
       	{ 
       		$("#suggestions").children().removeClass("suggestionHover");
			$(this).addClass("suggestionHover");
		},
		function()
		{ 
			$(this).removeClass("suggestionHover");
		});

	suggestionsDiv.append(suggestionDiv);
}

function showSearchSuggestions(results)
{
	var suggestionsDiv = $("#suggestions");
	suggestionsDiv.empty();

	var size = results.tags.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var tag = results.tags[cnt];
		console.log(cnt + " - " + tag.name);

		addSearchSuggestion(suggestionsDiv, tag);
	}

	suggestionsDiv.show();
}

function onSearchBoxEnterPressed()
{
	var suggestion = $("#suggestions").children(".suggestionHover");

	if (suggestion.length !== 0)
	{
		suggestion.click();
		return;
	}

	var searchBox = $("#searchBox");
	var searchText = searchBox.val();

	if (searchText === "")
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
		}, 
		function(response) 
	    {
	    	console.log("Search reply.");
	    	showSearchResults(response);
		});

	$("#suggestions").hide();
}

function onSearchBoxDownPressed()
{
	var suggestionsDiv = $("#suggestions");
	var currentSuggestion = suggestionsDiv.find(".suggestionHover");

	var nextSuggestion = null;
	if (currentSuggestion.length === 0 || currentSuggestion.next().length === 0)
	{
		nextSuggestion = suggestionsDiv.find(":first-child");
	}
	else
	{
		nextSuggestion = currentSuggestion.next();
	}

	if (currentSuggestion.length !== 0)
		currentSuggestion.removeClass("suggestionHover");

	nextSuggestion.focus();
	nextSuggestion.addClass("suggestionHover");
}

function onSearchBoxUpPressed()
{
	var suggestionsDiv = $("#suggestions");
	var currentSuggestion = suggestionsDiv.find(".suggestionHover");

	if (currentSuggestion.length === 0)
		return;

	var prevSuggestion = null;
	if (currentSuggestion.prev().length === 0)
	{
		prevSuggestion = suggestionsDiv.find(":last-child");
	}
	else
	{
		prevSuggestion = currentSuggestion.prev();
	}

	if (currentSuggestion.length !== 0)
		currentSuggestion.removeClass("suggestionHover");

	prevSuggestion.focus();
	prevSuggestion.addClass("suggestionHover");
}

function getBookById(id, onGetBookByIdDone)
{
	chrome.runtime.sendMessage(
		{
			command: "getObjectById",
			id: id,
			type: RESULT_TYPE_BOOK
		}, 
		function(response) 
	    {
	    	onGetBookByIdDone(response);
		});
}

function getSectionById(id, onGetSectionByIdDone)
{
	chrome.runtime.sendMessage(
		{
			command: "getObjectById",
			id: id,
			type: RESULT_TYPE_SECTION
		}, 
		function(response) 
	    {
	    	onGetSectionByIdDone(response);
		});
}

function getRecipeById(id, onGetRecipeByIdDone)
{
	chrome.runtime.sendMessage(
		{
			command: "getObjectById",
			id: id,
			type: RESULT_TYPE_RECIPE
		}, 
		function(response) 
	    {
	    	onGetRecipeByIdDone(response);
		});
}

function getTagById(id, onGetTagByIdDone)
{
	chrome.runtime.sendMessage(
		{
			command: "getObjectById",
			id: id,
			type: RESULT_TYPE_TAG
		}, 
		function(response) 
	    {
	    	onGetTagByIdDone(response);
		});
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

function onCalendarLinkClick()
{
	$("#calendar").show();
	$("#results").hide();
}

function onLoadDataClick()
{
	loadDatabase(
		function()
		{
			_currDate = getCurrentDate();

			fillCalendarView(_currDate);

			fillTagContainers();
		});
}

// function onSaveFileFound(dataFileEntry)
// {
// 	function replacer(key, value)
// 	{
// 		switch (key)
// 		{
// 			case "sectionIds":
// 			case "recipeIds":
// 				return undefined;
// 		}

// 		return value;
// 	}

// 	var jsonString = JSON.stringify(_db, replacer);
// 	var jsonBlob = new Blob([jsonString]);

// 	dataFileEntry.createWriter(
// 		function(writer) 
// 		{
// 			var truncated = false;

// 			writer.onerror = 
// 				function(e)
// 				{
// 	      		  console.log("Write failed: " + e.toString());
// 	      		};

//       		writer.onwriteend = 
//       			function(e) 
//       			{
//       				if (!truncated)
//       				{
// 						this.truncate(jsonBlob.size);
// 						truncated = true;

// 						return;
// 		      		}

// 		      		console.log("Write success!. New size: " + jsonBlob.size);
//         		}

// 			writer.write(jsonBlob);
// 		});
// }

// function onSaveDataClick()
// {
// 	chrome.syncFileSystem.requestFileSystem(
// 		function (fs) 
// 		{
// 	  	 	fs.root.getFile('RecipeManager-new.json', 
// 	  	 		{ create: true }, 
// 	  	 		onSaveFileFound, 
// 	  	 		onFileNotFound);
// 		});
// }

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
	if (_currDate.getMonth() === 0)
	{
		var year = _currDate.getFullYear();

		_currDate.setYear(--year);
		_currDate.setMonth(11);
	}
	else
	{
		var month = _currDate.getMonth();
		_currDate.setMonth(--month);
	}

	fillCalendarView(_currDate);
}

function onNextMonthClick()
{
	if (_currDate.month == 11)
	{
		var year = _currDate.getFullYear();

		_currDate.setYear(++year);
		_currDate.setMonth(0);
	}
	else
	{
		var month = _currDate.getMonth();
		_currDate.setMonth(++month);
	}

	fillCalendarView(_currDate);
}

function getCurrentDate()
{
	return new Date();
}

function getDaysInMonth(month)
{
	switch (month)
	{
		case 3:
		case 5:
		case 8:
		case 10:
			return 30;

		case 1:
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
	var monthName = getMonthName(date.getMonth());

	var monthTitleDiv = $("#currMonth");
	monthTitleDiv.text(monthName);

	var yearDiv = $("#year");
	yearDiv.text(date.getFullYear());

	var daysDiv = $("#days");
	daysDiv.empty();

	var firstDay = getDayOfWeek(1, date.getMonth(), date.getFullYear()) - 1;
	for (var cnt = 0; cnt < firstDay; cnt++)
	{
		daysDiv.append("<div class='dummyDay'>&nbsp</div>");
	}

	var days = getDaysInMonth(date.getMonth());
	for (cnt = 0; cnt < days; cnt++)
	{
		var day = cnt + 1;

		var dateData = new Date(date);
		dateData.setDate(day);

		var dayDiv = $("<div class='dayCell'><div class='day'>" + day + "</div></div>");
		dayDiv.data("date", dateData);

		dayDiv.on("click", onDayClicked);

		daysDiv.append(dayDiv);
	}

	var lastDay = getDayOfWeek(days, date.getMonth(), date.getFullYear());
	var daysToAdd = 7 - lastDay;
	
	for (cnt = 0; cnt < daysToAdd; cnt++)
	{
		daysDiv.append("<div class='dummyDay'>&nbsp</div>");
	}
}

function onDayClicked(event)
{
	var dayDiv = $(event.target);
	var date = dayDiv.data("date");

	console.log(date.toString());
}

function getDayOfWeek(day, month, year)
{
	var date = new Date(year, month, day, 1, 1, 1, 1);
	var weekDay = date.getDay();

	if (weekDay === 0)
		weekDay = 7;

	return weekDay;
}

function showSearchResults(results, clearResults)
{
	if (typeof clearResults == "undefined" || clearResults === true)
		clearSearchResults();

	_currentResults = results;

	if (results.books)
	{
		addResultsSection("Books", RESULT_TYPE_BOOK, results.books);
	}

	if (results.sections)
	{
		addResultsSection("Sections", RESULT_TYPE_SECTION, results.sections);
	}

	if (results.recipes)
	{
		addResultsSection("Recipes", RESULT_TYPE_RECIPE, results.recipes);
	}

	if (results.tags)
	{
		addResultsSection("Tags", RESULT_TYPE_TAG, results.tags);
	}

	showLoadingView(false);
}

function clearSearchResults()
{
	var resultsDiv = $("#results");
	resultsDiv.empty();

	_lastSectionId = -1;
	_currentResultsType = -1;
	_currentResultsDiv = null;
}

function addResultsSection(name, type, results)
{
	if (_currentResultsType != type)
	{
		var sectionDiv = $("<div class='resultSection'></div>");
		var sectionHeader = $("<div class='sectionHeader'></div>");

		sectionDiv.append(sectionHeader);
		sectionHeader.append("<div class='sectionTitle'>" + name + "</div>");
		sectionHeader.append("<div class='sectionAdd'>+</div>");

		_currentResultsType = type;
		_currentResultsDiv = sectionDiv;

		addResults(_currentResultsDiv, type, results);

		var resultsDiv = $("#results");
		resultsDiv.append(sectionDiv);

		return;
	}

	addResults(_currentResultsDiv, type, results);
}

function addResults(sectionDiv, type, results)
{
	switch (type)
	{
		case RESULT_TYPE_BOOK:
			addBookResults(sectionDiv, results);
			return;

		case RESULT_TYPE_SECTION:
			addSectionResults(sectionDiv, results);
			return;

		case RESULT_TYPE_RECIPE:
			addRecipeResults(sectionDiv, results);
			return;

		case RESULT_TYPE_TAG:
			addTagResults(sectionDiv, results);
			return;
	}
}

function addBookResults(sectionDiv, entries)
{
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

		if (book.id === 0)
			entryDiv.addClass("addNewEntry");

		addResultEntry(sectionDiv, RESULT_TYPE_BOOK, book, entryDiv);
	}
}

function addSectionResults(sectionDiv, sectionGroups)
{
	var sectionGroup = null;
	var sectionAdd = sectionDiv.find(".sectionAdd");

	if (sectionGroups.length > 1)
	{
		sectionAdd.hide();
	}
	else
	{
		sectionAdd.css("display", "flex");

		sectionGroup = sectionGroups[0];

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
		sectionGroup = sectionGroups[i];
		addSectionResultPath(sectionDiv, sectionGroup, onAddSectionResultPathDone);
	}
}

function onAddSectionResultPathDone(sectionDiv, sectionGroup)
{
	var sections = sectionGroup.sections.length;
	for (var j = 0; j < sections; j++)
	{
		var section = sectionGroup.sections[j];
		var entryDiv = $("<div class='resultEntry'>" + section.name + "</div>");

		if (section.id === 0)
			entryDiv.addClass("addNewEntry");

		addResultEntry(sectionDiv, RESULT_TYPE_SECTION, section, entryDiv);
	}	
}

function addSectionResultPath(sectionDiv, sectionGroup, onAddSectionResultPathDone)
{
	getBookById(sectionGroup.bookId,
		function(book)
		{
			var resultPathDiv = $("<div class='resultPath'></div>");

			var bookPathDiv = $("<div class='resultSubPath'>Book: " + book.name + "</div>");
			bookPathDiv.on("click", 
				function()
				{
					onSearchResultClick(RESULT_TYPE_BOOK, book.id);
				});

			resultPathDiv.append(bookPathDiv);
			sectionDiv.append(resultPathDiv);

			onAddSectionResultPathDone(sectionDiv, sectionGroup);
		});
}

function addRecipeResults(sectionDiv, recipeGroups)
{	
	var recipeGroup = null;
	var sectionAdd = sectionDiv.find(".sectionAdd");

	if (recipeGroups.length > 1)
	{
		sectionAdd.hide();
	}
	else
	{
		sectionAdd.css("display", "flex");

		recipeGroup = recipeGroups[0];

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
		recipeGroup = recipeGroups[i];

		if (_lastSectionId != recipeGroup.sectionId)
			addRecipeResultPath(sectionDiv, recipeGroup, onAddRecipeResultPathDone);
	}
}

function addRecipeResult(sectionDiv, recipe)
{
	var entryDiv = $("<div class='resultEntry'></div>");
	entryDiv.append("<div class='recipeName'>" + recipe.name + "</div>");

	if (recipe.id === 0)
	{
		entryDiv.addClass("addNewEntry");
	}
	else
	{
		var recipeInfo = "pg. " + recipe.page;

		if (recipe.isCooked === 1)
			recipeInfo += "; Cooked";

		if (recipe.isInteresting === 1)
			recipeInfo += "; Interesting";

		entryDiv.append("<div class='recipeInfo'>" + recipeInfo + "</div>");
	}

	addResultEntry(sectionDiv, RESULT_TYPE_RECIPE, recipe, entryDiv);
}

function onAddRecipeResultPathDone(sectionDiv, recipeGroup)
{
	_lastSectionId = recipeGroup.sectionId;
		
	var recipes = recipeGroup.recipes.length;
	for (var j = 0; j < recipes; j++)
	{
		var recipe = recipeGroup.recipes[j];
		addRecipeResult(sectionDiv, recipe);
	}	
}

function addRecipeResultPath(sectionDiv, recipeGroup, onAddRecipeResultPathDone)
{
	getSectionById(recipeGroup.sectionId,
		function (section)
		{
			getBookById(section.bookId, 
				function (book)
				{
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

					onAddRecipeResultPathDone(sectionDiv, recipeGroup);
				});
		});
}

function addTagResults(sectionDiv, entries)
{
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
		addDateButton(resultDiv, type, entry.id);
	
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
			onDeleteClick(type, id,
				function()
				{
					resultDiv.remove();
				});
			
			e.stopPropagation();
		});

	resultDiv.append(deleteButton);
}

function addDateButton(resultDiv, type, id)
{
	if (type != RESULT_TYPE_RECIPE)
		return;

	var dateButton = $("<div class='resultButtons'>date</div>");

	dateButton.on("click", 
		function(e)
		{
			onDateClick(type, id);
			e.stopPropagation();
		});

	resultDiv.append(dateButton);
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
	chrome.runtime.sendMessage(
	{
		command: "getAllBooks",
	}, 
	function(response) 
    {
    	console.log("Search reply.");
    	showSearchResults(response);
	});
}

function showBookSections(id)
{
	chrome.runtime.sendMessage(
	{
		command: "getBookSections",
		id: id,
	}, 
	function(response) 
    {
    	console.log("Search reply.");
    	showSearchResults(response);
	});
}

function showSectionRecipes(id)
{
	chrome.runtime.sendMessage(
	{
		command: "getSectionRecipes",
		id: id,
	}, 
	function(response) 
    {
    	console.log("Search reply.");
    	showSearchResults(response);
	});
}

function showRecipeView(recipe, isNewEntry)
{
	var recipeView = $("#recipe");

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
			onRecipeOKClick(recipe.id, recipe);
		});

	var btnCancel = recipeView.find(".btnCancel");
	btnCancel.off("click");

	btnCancel.on("click", 
		function()
		{
			if (isNewEntry === true)
				recipe.id = 0;

			showRecipe(recipe.id);
		});

	recipeView.css("display", "flex");
}

function showRecipe(id, parentId)
{
	resetRecipeView();

	if (id === 0)
	{
		onRecipeCloseClick();
		return;
	}

	getRecipeById(id,
		function(recipe)
		{
			var isNewEntry = false;

			if (recipe === null)
			{
				isNewEntry = true;

				recipe = new Recipe();

				recipe.id = id;
				recipe.sectionId = parentId;

				getSectionById(parentId,
					function(section)
					{
						recipe.tagIds = section.tagIds;		
						onRecipeEditClick();

						showRecipeView(recipe, isNewEntry);
					});

				return;
			}

			showRecipeView(recipe, isNewEntry);
		});
}

function showTagRecipes(id)
{
	chrome.runtime.sendMessage(
	{
		command: "getTagRecipes",
		id: id,
	}, 
	function(response) 
    {
    	showSearchResults(response);
	});
}

function showTags()
{
	chrome.runtime.sendMessage(
	{
		command: "getAllTags",
	}, 
	function(response) 
    {
    	console.log("Search reply.");
    	showSearchResults(response);
	});
}

function onRecipeCloseClick()
{
	$("#recipe").hide();
	resetRecipeView();
}

function onRecipeOKClick(id, recipe)
{
	var recipeView = $("#recipe");

	recipe.name = recipeView.find("#titleCtrl").val();
	recipe.page = recipeView.find("#pageCtrl").val();
	recipe.isCooked = recipeView.find("#cookedCtrl").prop("checked");
	recipe.isInteresting = recipeView.find("#interestingCtrl").prop("checked");
	recipe.comment = recipeView.find("#commentCtrl").val();

	recipe.tagIds = getCheckedTagIds(recipeView);

	chrome.runtime.sendMessage(
	{
		command: "updateRecipe",
		id: id,
		recipe: recipe
	}, 
	function() 
    {
    	recipeView.hide();
		resetRecipeView();

		refreshResultsView();
	});
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
	chrome.runtime.sendMessage(
	{
		command: "getAllTags",
	}, 
	function(response) 
    {
    	var tags = response.tags;

    	if (tags.length == 1)
    		return;

    	var tagContainer = $(".tagContainer");

		var tagLabels = tagContainer.find(".tagLabels");
		var tagControls = tagContainer.find(".tagControls");

		tagLabels.empty();
		tagControls.empty();

		var size = tags.length;
		for (var cnt = 0; cnt < size; cnt++)
		{
			var tag = tags[cnt];

			var tagLabel = $("<div class='tagLabel'>" + tag.name + "</div>");
			var tagControlDiv = $("<div class='tagControl'></div>");
			var tagControl = $("<input type='checkbox' disabled/>");

			tagControlDiv.append(tagControl);
			tagControl.data("id", tag.id);

			tagLabels.append(tagLabel);
			tagControls.append(tagControlDiv);
		}
	});
}

function checkTags(parent, tagIds)
{
	var size = tagIds.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var tagControl = getTagControlById(parent, tagIds[cnt]);

		if (tagControl === null)
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

function showSection(id, parentId)
{
	resetSectionView();

	if (id === 0)
	{
		onSectionCloseClick();
		return;
	}

	getSectionById(id,
		function(section)
		{
			var isNewEntry = false;

			if (section === null)
			{
				isNewEntry = true;

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
				});

			var btnCancel = sectionView.find(".btnCancel");
			btnCancel.off("click");

			btnCancel.on("click", 
				function()
				{
					if (isNewEntry === true)
						id = 0;

					showSection(id, parentId);
				});

			sectionView.css("display", "flex");
		});
}

function onSectionOKClick(id, section)
{
	var sectionView = $("#section");
	section.name = sectionView.find("#titleCtrl").val();

	var tagIdDiff = getCheckedTagsDiff(sectionView, section.tagIds);
	section.tagIds = getCheckedTagIds(sectionView);

	chrome.runtime.sendMessage(
	{
		command: "updateSection",
		id: id,
		section: section,
		tagIdDiff: tagIdDiff
	}, 
	function() 
    {
		sectionView.hide();
		resetSectionView();

		refreshResultsView();
	});
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

	if (id === 0)
	{
		onBookCloseClick();
		return;
	}

	getBookById(id,
		function (book)
		{
			var isNewEntry = false;

			if (book === null)
			{
				isNewEntry = true;

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
				});

			var btnCancel = bookView.find(".btnCancel");
			btnCancel.off("click");

			btnCancel.on("click", 
				function()
				{
					if (isNewEntry === true)
						id = 0;

					showBook(id);
				});

			bookView.css("display", "flex");
		});
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

function onBookOKClick(id, book)
{
	var bookView = $("#book");
	book.name = bookView.find("#titleCtrl").val();

	chrome.runtime.sendMessage(
	{
		command: "updateBook",
		id: id,
		book: book,
	}, 
	function() 
    {
		bookView.hide();
		resetBookView();

		refreshResultsView();
	});
}

function onDateClick(type, id)
{
	if (type != RESULT_TYPE_RECIPE)
		return;

	showAddRecipeToDateView(id);
}

function showAddRecipeToDateView(id)
{
	$("#addRecipeToDate").show();
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

function onDeleteClick(type, id, onDeleteDone)
{
	switch (type)
	{
		case RESULT_TYPE_RECIPE:
			deleteRecipe(id, onDeleteDone);
			return;

		case RESULT_TYPE_SECTION:
			deleteSection(id, onDeleteDone);
			return;

		case RESULT_TYPE_BOOK:
			deleteBook(id, onDeleteDone);
			return;
	}
}

function deleteRecipe(id, removeFromSection, onDeleteRecipeDone)
{
	chrome.runtime.sendMessage(
	{
		command: "deleteObject",
		type: RESULT_TYPE_RECIPE,
		id: id,
		removeFromParent: removeFromSection
	}, 
	function() 
    {
    	if (onDeleteRecipeDone !== null)
			onDeleteRecipeDone();
	});
}

function deleteSection(id, removeFromBook, onDeleteSectionDone)
{
	chrome.runtime.sendMessage(
	{
		command: "deleteObject",
		type: RESULT_TYPE_SECTION,
		id: id,
		removeFromParent: removeFromBook
	}, 
	function() 
    {
    	if (onDeleteSectionDone !== null)
			onDeleteSectionDone();
	});
}

function deleteBook(id, onDeleteBookDone)
{
	chrome.runtime.sendMessage(
	{
		command: "deleteObject",
		type: RESULT_TYPE_BOOK,
		id: id,
	}, 
	function() 
    {
		if (onDeleteBookDone !== null)
			onDeleteBookDone();
	});
}

function refreshResultsView()
{
	showSearchResults(_currentResults);
}

function onAddClick(type, parentId)
{
	getNextAvailableId(type,
		function(id)
		{
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
		});
}

function getNextAvailableId(type, onGetNextAvailableIdDone)
{
	chrome.runtime.sendMessage(
	{
		command: "getNextAvailableId",
		type: type
	}, 
	function(response) 
    {
		onGetNextAvailableIdDone(response);
	});
}

function showTag(id)
{
	resetTagView();

	if (id === 0)
	{
		onTagCloseClick();
		return;
	}

	getTagById(id,
		function(tag)
		{
			var isNewEntry = false;

			if (tag === null)
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
					onTagOKClick(id);
				});

			var btnCancel = tagView.find(".btnCancel");
			btnCancel.off("click");

			btnCancel.on("click", 
				function()
				{
					if (isNewEntry === true)
						id = 0;

					showTag(id);
				});

			tagView.css("display", "flex");
		});
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

function onTagOKClick(id, tag)
{
	var tagView = $("#tag");
	tag.name = tagView.find("#titleCtrl").val();

	chrome.runtime.sendMessage(
	{
		command: "updateTag",
		id: id,
		tag: tag,
	}, 
	function() 
    {
		tagView.hide();
		resetTagView();

		fillTagContainers();
		refreshResultsView();
	});
}