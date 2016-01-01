"use strict";

/* globals RESULT_TYPE_BOOK */
/* globals RESULT_TYPE_SECTION */
/* globals RESULT_TYPE_RECIPE */
/* globals RESULT_TYPE_TAG */
/* globals RESULT_TYPE_DATEENTRY */

/* globals KEY_UP */
/* globals KEY_DOWN */
/* globals KEY_ENTER */
/* globals KEY_ESC */

/* globals Recipe */
/* globals Book */
/* globals Section */
/* globals Tag */
/* globals DateEntry */
/* globals DateRecipe */

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

	$("#recipeSuggestions")
		.on("mouseover", 
			function()
			{
				$("#recipeSuggestions").data("hovered", true);
			})
		.on("mouseout",
			function()
			{
				$("#recipeSuggestions").data("hovered", false);
			});

	$("#calendarLink").on("click", onCalendarLinkClick);
	$("#title").on("click", onTitleClick);
	$("#prevMonth").on("click", onPrevMonthClick);
	$("#nextMonth").on("click", onNextMonthClick);
	$("#loadData").on("click", onLoadDataClick);
	//$("#saveData").on("click", onSaveDataClick);
	$("#books").on("click", showBooks);
	$("#tags").on("click", showTags);

	var recipeDlg = $("#recipe");

	recipeDlg.find(".btnEdit").on("click", onRecipeEditClick);
	recipeDlg.find(".btnClose, .closeButton").on("click", onRecipeCloseClick);

	var sectionDlg = $("#section");

	sectionDlg.find(".btnEdit").on("click", onSectionEditClick);
	sectionDlg.find(".btnClose, .closeButton").on("click", onSectionCloseClick);

	var bookDlg = $("#book");

	bookDlg.find(".btnEdit").on("click", onBookEditClick);
	bookDlg.find(".btnClose, .closeButton").on("click", onBookCloseClick);

	var tagDlg = $("#tag");

	tagDlg.find(".btnEdit").on("click", onTagEditClick);
	tagDlg.find(".btnClose, .closeButton").on("click", onTagCloseClick);

	var dayMenuDlg = $("#dayMenu");
	
	dayMenuDlg.find(".closeButton").on("click", onDayMenuCloseClick);

	$("#recipeContainer").sortable(
		{
			axis: "y",
			revert: true,
			scroll: false,
			cursor: "move",
			stop: onRecipeDragStopped,
			helper: "clone"
		});

	$("#dialogContainer").children().draggable(
		{ 
			containment: "#dialogContainer",
			cursor: "move"
		});

	$("#content")
		.on("scroll", 
			function() 
			{
				var contentDiv = $("#content");

			    var yPos = contentDiv.scrollTop();
			    var pageHeight = contentDiv.height();

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
	
	$(window).on("resize",
		function()
		{
			refreshDayRecipes();
		});

	$("#dialogContainer").keydown(
		function(event)
			{
				if (event.keyCode !== KEY_ESC)
					return;

				var dialog = $("#dialogContainer").find("div:visible:first");

				var btnCancel = dialog.find(".btnCancel");

				if (btnCancel.length !== 0 && btnCancel.is(":visible"))
				{
					btnCancel.click();
					return;
				}

				dialog.find(".closeButton").click();
			});
}

function onRecipeDragStopped(e, ui)
{
	console.log("drag stopped");

	var nextRecipe = null;

	var nextRecipeDiv = ui.item.next();

	if (nextRecipeDiv !== null)
		nextRecipe = nextRecipeDiv.data("recipe");

	var recipe = ui.item.data("recipe");

	moveRecipeInDateEntry(recipe, nextRecipe);

	e.stopPropagation();

	var dayMenuDiv = $("#dayMenu");
	var dayDiv = dayMenuDiv.data("dayDiv");

	fillDayRecipes(dayDiv);
}

function moveRecipeInDateEntry(recipeToMove, nextRecipe)
{
	var dayMenuDlg = $("#dayMenu");
	var dateEntry = dayMenuDlg.data("dateEntry");

	var recipe = null;

	for (var cnt = 0; cnt < dateEntry.recipes.length; cnt++)
	{
		recipe = dateEntry.recipes[cnt];

		if (recipe === recipeToMove)
		{
			dateEntry.recipes.splice(cnt, 1);
			break;
		}
	}

	for (cnt = 0; cnt < dateEntry.recipes.length; cnt++)
	{
		recipe = dateEntry.recipes[cnt];

		if (recipe === nextRecipe)
		{
			dateEntry.recipes.splice(cnt, 0, recipeToMove);
			break;
		}
	}

	chrome.runtime.sendMessage(
	{
		command: "updateDateEntry",
		dateEntry: dateEntry
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

function getDateEntryById(id, onGetDateEntryByIdDone)
{
	chrome.runtime.sendMessage(
		{
			command: "getObjectById",
			id: id,
			type: RESULT_TYPE_DATEENTRY
		}, 
		function(response) 
	    {
	    	onGetDateEntryByIdDone(response);
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
	clearSearchBox();

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

function getPrevMonthDate(date)
{
	var prevMonthDate = new Date(date);

	if (date.getMonth() === 0)
	{
		var year = date.getFullYear();

		prevMonthDate.setYear(--year);
		prevMonthDate.setMonth(11);
	}
	else
	{
		var month = date.getMonth();
		prevMonthDate.setMonth(--month);
	}

	return prevMonthDate;
}

function getNextMonthDate(date)
{
	var nextMonthDate = new Date(date);

	if (date.month == 11)
	{
		var year = date.getFullYear();

		nextMonthDate.setYear(++year);
		nextMonthDate.setMonth(0);
	}
	else
	{
		var month = date.getMonth();
		nextMonthDate.setMonth(++month);
	}

	return nextMonthDate;
}

function onPrevMonthClick()
{
	_currDate = getPrevMonthDate(_currDate);
	fillCalendarView(_currDate);
}

function onNextMonthClick()
{
	_currDate = getNextMonthDate(_currDate);
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

	var days = getDaysInMonth(date.getMonth());
	var lastDay = getDayOfWeek(days, date.getMonth(), date.getFullYear());
	
	var daysToAdd = 7 - lastDay;
	
	var totalDays = firstDay + days + daysToAdd;

	if ((totalDays / 7) < 6)
	{
		daysToAdd += 7;
		totalDays += 7;
	}

	if ((totalDays / 7) < 6)
	{
		firstDay += 7;
		totalDays += 7;
	}

	var prevMonthDate = getPrevMonthDate(date);
	var prevMonthDays = getDaysInMonth(prevMonthDate.getMonth());

	var dummyDay = null;

	for (var cnt = 0; cnt < firstDay; cnt++)
	{
		var prevMonthDay = prevMonthDays - (firstDay - cnt - 1);

		dummyDay = $("<div class='dayCell dummyDay'><div class='day'>" + prevMonthDay + "</div></div>");
		dummyDay.on("click", onPrevMonthClick);

		daysDiv.append(dummyDay);
	}

	for (cnt = 0; cnt < days; cnt++)
	{
		var day = cnt + 1;

		var dateData = new Date(date);
		dateData.setDate(day);

		var dayDiv = $("<div class='dayCell availDay'><div class='day'>" + day + "</div></div>");
		dayDiv.data("date", dateData);

		dayDiv.on("click", onDayClicked);

		daysDiv.append(dayDiv);
	}

	for (cnt = 0; cnt < daysToAdd; cnt++)
	{
		dummyDay = $("<div class='dayCell dummyDay'><div class='day'>" + (cnt + 1) + "</div></div>");
		dummyDay.on("click", onNextMonthClick);

		daysDiv.append(dummyDay);
	}

	refreshDayRecipes();
}

function getDateIdFromDate(date)
{
	return date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear();
}

function fillDayRecipes(dayDiv)
{
	var date = dayDiv.data("date");
	var dateId = getDateIdFromDate(date);

	getDateEntryById(dateId, 
		function(dateEntry)
		{
			if (dateEntry === null)
				return;

			dayDiv.children(".dayViewRecipe").remove();
			
			var height = dayDiv.height();
			
			var padding = 5;
			var recipeMargin = 5;
			var dayNumberHeight = 18 + padding;

			var recipeHeight = 20 + recipeMargin;

			var availableSpace = height - dayNumberHeight;
			var maxRecipesToShow = Math.floor(availableSpace / recipeHeight);

			var addMoreEntry = false;

			if (maxRecipesToShow < dateEntry.recipes.length)
			{
				addMoreEntry = true;
				maxRecipesToShow--;
			}

			var dayViewRecipe = null;
			var recipesToShow = Math.min(dateEntry.recipes.length, maxRecipesToShow);

			for (var cnt = 0; cnt < recipesToShow; cnt++)
			{
				var recipe = dateEntry.recipes[cnt];

				dayViewRecipe = $("<div class='dayViewRecipe'>" + recipe.name + "</div>");
				dayDiv.append(dayViewRecipe);
			}

			if (addMoreEntry === true)
			{
				dayViewRecipe = $("<div class='dayViewRecipe'>More...</div>");
				dayDiv.append(dayViewRecipe);
			}

			$(".dayViewRecipe").css("width", dayDiv.width() - 16);

			var dayNumberDiv = dayDiv.children(".day");

			if (recipesToShow > 0)
			{
				dayNumberDiv.css("font-weight", "bold");
			}
			else
			{
				dayNumberDiv.css("font-weight", "normal");
			}
		});
}

function refreshDayRecipes()
{
	var dayDivs = $(".availDay");

	for (var cnt = 0; cnt < dayDivs.length; cnt++)
	{
		var dayDiv = $(dayDivs[cnt]);
		fillDayRecipes(dayDiv);
	}
}

function onDayClicked(event)
{
	var dayDiv = $(event.target);
	var date = dayDiv.data("date");

	var dateId = getDateIdFromDate(date);

	getDateEntryById(dateId,
		function(dateEntry)
		{
			if (dateEntry === null)
			{
				dateEntry = new DateEntry();
				dateEntry.id = dateId;
			}

			console.log(date.toString());

			var dayMenuDiv = $("#dayMenu");

			dayMenuDiv.data("dayDiv", dayDiv);
			dayMenuDiv.data("dateEntry", dateEntry);

			showDialog(dayMenuDiv);

			$("#recipeSuggestions").empty();
			
			$(".recipeEntry").remove();
			$(".addRecipeEntry").remove();

			$("#dateHeader").text(date.toDateString());

			for (var cnt = 0; cnt < dateEntry.recipes.length; cnt++)
			{
				var recipe = dateEntry.recipes[cnt];
				addDateRecipeEntry(dateEntry, recipe);
			}

			var addRecipeEntry = $("<div class='addRecipeEntry'>Add Recipe...</div>");
			addRecipeEntry.on("click", 
				function()
				{
					onAddRecipeEntryClick();
				});

			dayMenuDiv.append(addRecipeEntry);
		});
}

function onAddRecipeEntryClick()
{
	var addRecipeEntry = $(".addRecipeEntry");
	var inputState = addRecipeEntry.data("inputState");

	if (inputState === true)
		return;

	addRecipeEntry.html("<input id='recipeSearch' type='text'>");
	addRecipeEntry.data("inputState", true);

	var addRecipeInput = addRecipeEntry.children("input");
	addRecipeInput.focus();

	addRecipeInput
		.on("input", 
			function()
			{
				onAddRecipeInputChanged(addRecipeInput);
			})
		.blur(
			function()
			{
				if ($("#recipeSuggestions").data("hovered") === true)
					return;

				addRecipeEntry.html("Add Recipe...");
				addRecipeEntry.data("inputState", false);

				addRecipeEntry.off("blur");
			})
		.keydown(
			function(event)
			{
				switch (event.keyCode)
				{
					case KEY_ENTER:
						onRecipeSearchEnterPressed();
						break;

					case KEY_UP:
						onRecipeSearchUpPressed();
						break;

					case KEY_DOWN:
						onRecipeSearchDownPressed();
						break;
				}
			});
}

function onRecipeSearchEnterPressed()
{
	var suggestionsDiv = $("#recipeSuggestions");
	var currentSuggestion = suggestionsDiv.find(".recipeSuggestionHover");

	if (currentSuggestion.length !== 0)
	{
		currentSuggestion.click();
		return;
	}

	var dayMenuDiv = $("#dayMenu");
	var dateEntry = dayMenuDiv.data("dateEntry");

	var addRecipeEntry = $(".addRecipeEntry");
	var addRecipeInput = addRecipeEntry.children("input");

	var newDateRecipe = new DateRecipe();
	newDateRecipe.name = addRecipeInput.val();
	newDateRecipe.id = addRecipeInput.data("recipeId");

	dateEntry.recipes.push(newDateRecipe);

	chrome.runtime.sendMessage(
		{
			command: "updateDateEntry",
			dateEntry: dateEntry
		}, 
		function() 
	    {
	    	addDateRecipeEntry(dateEntry, newDateRecipe);

			addRecipeInput.blur();

			suggestionsDiv.hide();
			suggestionsDiv.children().removeClass("recipeSuggestionHover");

			var dayDiv = dayMenuDiv.data("dayDiv");
			fillDayRecipes(dayDiv);
		});
}

function addDateRecipeEntry(dateEntry, newDateRecipe)
{
	var newRecipeEntry = $("<div class='recipeEntry'></div>");
	    	
	var recipeEntryName = $("<div class='recipeEntryName'>" + newDateRecipe.name + "</div>");
	newRecipeEntry.append(recipeEntryName);
	
	var recipeEntryDelete = $("<div class='recipeEntryButton'><img src='images/delete.png' class='recipeEntryIcon'></div>");
	newRecipeEntry.append(recipeEntryDelete);

	recipeEntryDelete.on("click",
		function()
		{
			removeRecipeFromDateEntry(dateEntry, newDateRecipe);
			newRecipeEntry.remove();

			var dayMenuDiv = $("#dayMenu");
			var dayDiv = dayMenuDiv.data("dayDiv");

			fillDayRecipes(dayDiv);
		});

	newRecipeEntry.data("recipe", newDateRecipe);

	recipeEntryName.on("click", onRecipeEntryClick);

	var recipeContainer = $("#recipeContainer");
	recipeContainer.append(newRecipeEntry);
}

function onRecipeEntryClick(event)
{
	var recipeEntry = $(event.target).parent();

	var recipe = recipeEntry.data("recipe");

	if (recipe.id !== 0)
		showRecipe(recipe.id);
}

function removeRecipeFromDateEntry(dateEntry, recipeToRemove)
{
	for (var cnt = 0; cnt < dateEntry.recipes.length; cnt++)
	{
		var recipe = dateEntry.recipes[cnt];

		if (recipe === recipeToRemove)
		{
			dateEntry.recipes.splice(cnt, 1);
			break;
		}
	}

	chrome.runtime.sendMessage(
	{
		command: "updateDateEntry",
		dateEntry: dateEntry
	}, 
	function() 
    {
	});
}

function onRecipeSearchDownPressed()
{
	var suggestionsDiv = $("#recipeSuggestions");
	var currentSuggestion = suggestionsDiv.find(".recipeSuggestionHover");

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
		currentSuggestion.removeClass("recipeSuggestionHover");

	nextSuggestion.focus();
	nextSuggestion.addClass("recipeSuggestionHover");
}

function onRecipeSearchUpPressed()
{
	var suggestionsDiv = $("#recipeSuggestions");
	var currentSuggestion = suggestionsDiv.find(".recipeSuggestionHover");

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
		currentSuggestion.removeClass("recipeSuggestionHover");

	prevSuggestion.focus();
	prevSuggestion.addClass("recipeSuggestionHover");
}

function onAddRecipeInputChanged(addRecipeInput)
{
	var searchText = addRecipeInput.val();

	if (searchText === "")
	{
		$("#recipeSuggestions").empty();
		return;
	}

	chrome.runtime.sendMessage(
		{
			command: "getRecipeSuggestions",
			searchText: searchText,
		}, 
		function(response) 
	    {
	    	showRecipeSuggestions(addRecipeInput, response);
		});
}

function showRecipeSuggestions(addRecipeInput, results)
{
	var recipeSuggestions = $("#recipeSuggestions");

	var inputPos = addRecipeInput.position();
	recipeSuggestions.css("top", inputPos.top + addRecipeInput.outerHeight() + 1);
	recipeSuggestions.css("left", inputPos.left);
	recipeSuggestions.css("width", addRecipeInput.outerWidth() - 2);

	recipeSuggestions.show();
	recipeSuggestions.empty();

	var searchText = addRecipeInput.val();

	var customRecipe = new Recipe();
	customRecipe.name = searchText;
	customRecipe.id = 0;

	addRecipeSuggestion(recipeSuggestions, customRecipe);

	var size = results.recipes.length;
	for (var cnt = 0; cnt < size; cnt++)
	{
		var recipe = results.recipes[cnt];
		console.log(cnt + " - " + recipe.name);

		addRecipeSuggestion(recipeSuggestions, recipe);
	}
}

function addRecipeSuggestion(recipeSuggestionsDiv, recipe)
{
	var recipeSuggestionDiv = $("<div class='recipeSuggestion'>" + recipe.name + "</div>");

	if (recipe.id === 0)
		recipeSuggestionDiv.addClass("recipeSuggestionHover");

	recipeSuggestionDiv.on("click",
		function(event)
		{
			$("#recipeSearch").val(recipe.name);
			$("#recipeSearch").data("recipeId", recipe.id);

			recipeSuggestionsDiv.hide();
			recipeSuggestionsDiv.children().removeClass("recipeSuggestionHover");

			$("#recipeSearch").focus();

			event.stopPropagation();
		});

	recipeSuggestionDiv.hover(
		function()
       	{ 
       		$("#recipeSuggestions").children().removeClass("recipeSuggestionHover");
			$(this).addClass("recipeSuggestionHover");
		},
		function()
		{ 
			$(this).removeClass("recipeSuggestionHover");
		});

	recipeSuggestionsDiv.append(recipeSuggestionDiv);
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
		addStarRating(resultDiv, type, entry.id);
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
	var editButton = $("<div class='resultButtons'><img src='images/pencil.png' class='resultIcon'></div>");

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
	var deleteButton = $("<div class='resultButtons'><img src='images/delete.png' class='resultIcon'></div>");

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

function addStarRating(resultDiv, type, id)
{
	if (type != RESULT_TYPE_RECIPE)
		return;

	var starButton1 = $("<div class='resultButtons'><img src='images/star.png' class='resultIcon'></div>");
	var starButton2 = $("<div class='resultButtons'><img src='images/star.png' class='resultIcon'></div>");
	var starButton3 = $("<div class='resultButtons'><img src='images/star.png' class='resultIcon'></div>");

	starButton1.hover(
		function()
		{
			starButton1.addClass("starFull");	
			starButton2.removeClass("starFull");
			starButton3.removeClass("starFull");
		});

	starButton2.hover(
		function()
		{
			starButton1.addClass("starFull");	
			starButton2.addClass("starFull");
			starButton3.removeClass("starFull");
		});

	starButton3.hover(
		function()
		{
			starButton1.addClass("starFull");	
			starButton2.addClass("starFull");
			starButton3.addClass("starFull");
		});

	starButton1.on("click", 
		function(e)
		{
			onStarClick(type, id,
				function()
				{
					resultDiv.remove();
				});
			
			e.stopPropagation();
		});

	resultDiv.append(starButton1);
	resultDiv.append(starButton2);
	resultDiv.append(starButton3);
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
	clearSearchBox();

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
	clearSearchBox();

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
	clearSearchBox();

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

function showRecipeDlg(recipe, isNewEntry)
{
	var recipeDlg = $("#recipe");

	recipeDlg.find("#titleCtrl").val(recipe.name);
	recipeDlg.find("#pageCtrl").val(recipe.page);
	recipeDlg.find("#cookedCtrl").prop("checked", recipe.isCooked);
	recipeDlg.find("#interestingCtrl").prop("checked", recipe.isInteresting);
	recipeDlg.find("#commentCtrl").val(recipe.comment);

	checkTags(recipeDlg, recipe.tagIds);

	var btnOK = recipeDlg.find(".btnOK");
	btnOK.off("click");

	btnOK.on("click", 
		function()
		{
			onRecipeOKClick(recipe.id, recipe);
		});

	var btnCancel = recipeDlg.find(".btnCancel");
	btnCancel.off("click");

	btnCancel.on("click", 
		function()
		{
			if (isNewEntry === true)
				recipe.id = 0;

			showRecipe(recipe.id);
		});

	showDialog(recipeDlg);
}

function showRecipe(id, parentId)
{
	resetRecipeDlg();

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

						showRecipeDlg(recipe, isNewEntry);
					});

				return;
			}

			showRecipeDlg(recipe, isNewEntry);
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
	clearSearchBox();

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
	closeDialog($("#recipe"));
	resetRecipeDlg();
}

function onRecipeOKClick(id, recipe)
{
	var recipeDlg = $("#recipe");

	recipe.name = recipeDlg.find("#titleCtrl").val();
	recipe.page = recipeDlg.find("#pageCtrl").val();
	recipe.isCooked = recipeDlg.find("#cookedCtrl").prop("checked");
	recipe.isInteresting = recipeDlg.find("#interestingCtrl").prop("checked");
	recipe.comment = recipeDlg.find("#commentCtrl").val();

	recipe.tagIds = getCheckedTagIds(recipeDlg);

	chrome.runtime.sendMessage(
	{
		command: "updateRecipe",
		id: id,
		recipe: recipe
	}, 
	function() 
    {
		showRecipe(id);
		refreshResultsView();
	});
}

function resetRecipeDlg()
{
	var recipeDlg = $("#recipe");

	recipeDlg.find("#cookedCtrl, #interestingCtrl").attr("disabled", true);
	recipeDlg.find("#titleCtrl, #pageCtrl, #commentCtrl").attr("readonly", true);

	recipeDlg.find(".btnEdit, .btnClose").show();
	recipeDlg.find(".btnOK, .btnCancel").hide();

	var allTagControls = recipeDlg.find(".tagControl").children();

	allTagControls.attr("disabled", true);
	allTagControls.prop("checked", false);		
}

function onRecipeEditClick()
{
	var recipeDlg = $("#recipe");

	recipeDlg.find("#cookedCtrl, #interestingCtrl").removeAttr("disabled");
	recipeDlg.find("#titleCtrl, #pageCtrl, #commentCtrl").removeAttr("readonly");

	recipeDlg.find(".tagControl").children().removeAttr("disabled");

	recipeDlg.find(".btnOK, .btnCancel").show();
	recipeDlg.find(".btnEdit, .btnClose").hide();

	recipeDlg.find("#titleCtrl").focus();
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
	resetSectionDlg();

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

			var sectionDlg = $("#section");

			sectionDlg.find("#titleCtrl").val(section.name);
			checkTags(sectionDlg, section.tagIds);

			var btnOK = sectionDlg.find(".btnOK");
			btnOK.off("click");

			btnOK.on("click", 
				function()
				{
					onSectionOKClick(id, section);
				});

			var btnCancel = sectionDlg.find(".btnCancel");
			btnCancel.off("click");

			btnCancel.on("click", 
				function()
				{
					if (isNewEntry === true)
						id = 0;

					showSection(id, section.bookId);
				});

			showDialog(sectionDlg);
		});
}

function onSectionOKClick(id, section)
{
	var sectionDlg = $("#section");
	section.name = sectionDlg.find("#titleCtrl").val();

	var tagIdDiff = getCheckedTagsDiff(sectionDlg, section.tagIds);
	section.tagIds = getCheckedTagIds(sectionDlg);

	chrome.runtime.sendMessage(
	{
		command: "updateSection",
		id: id,
		section: section,
		tagIdDiff: tagIdDiff
	}, 
	function() 
    {
		showSection(id, section.bookId);
		refreshResultsView();
	});
}

function resetSectionDlg()
{
	var sectionDlg = $("#section");

	sectionDlg.find("#titleCtrl").attr("readonly", true);

	sectionDlg.find(".btnEdit, .btnClose").show();
	sectionDlg.find(".btnOK, .btnCancel").hide();

	var allTagControls = sectionDlg.find(".tagControl").children();

	allTagControls.attr("disabled", true);
	allTagControls.prop("checked", false);		
}

function onSectionEditClick()
{
	var sectionDlg = $("#section");

	sectionDlg.find("#titleCtrl").removeAttr("readonly");
	sectionDlg.find(".tagControl").children().removeAttr("disabled");

	sectionDlg.find(".btnOK, .btnCancel").show();
	sectionDlg.find(".btnEdit, .btnClose").hide();

	sectionDlg.find("#titleCtrl").focus();
}

function onSectionCloseClick()
{
	closeDialog($("#section"));
	resetSectionDlg();
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
	resetBookDlg();

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

			var bookDlg = $("#book");
			bookDlg.find("#titleCtrl").val(book.name);

			var btnOK = bookDlg.find(".btnOK");
			btnOK.off("click");

			btnOK.on("click", 
				function()
				{
					onBookOKClick(id, book);
				});

			var btnCancel = bookDlg.find(".btnCancel");
			btnCancel.off("click");

			btnCancel.on("click", 
				function()
				{
					if (isNewEntry === true)
						id = 0;

					showBook(id);
				});

			showDialog(bookDlg);
		});
}

function resetBookDlg()
{
	var bookDlg = $("#book");

	bookDlg.find("#titleCtrl").attr("readonly", true);

	bookDlg.find(".btnEdit, .btnClose").show();
	bookDlg.find(".btnOK, .btnCancel").hide();
}

function onBookEditClick()
{
	var bookDlg = $("#book");

	bookDlg.find("#titleCtrl").removeAttr("readonly");

	bookDlg.find(".btnOK, .btnCancel").show();
	bookDlg.find(".btnEdit, .btnClose").hide();

	bookDlg.find("#titleCtrl").focus();
}

function onBookCloseClick()
{
	closeDialog($("#book"));
	resetBookDlg();
}

function onBookOKClick(id, book)
{
	var bookDlg = $("#book");
	book.name = bookDlg.find("#titleCtrl").val();

	chrome.runtime.sendMessage(
	{
		command: "updateBook",
		id: id,
		book: book,
	}, 
	function() 
    {
		showBook(id);
		refreshResultsView();
	});
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
	resetTagDlg();

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
				isNewEntry = true;

				tag = new Tag();
				tag.id = id;

				onTagEditClick();
			}

			var tagDlg = $("#tag");
			tagDlg.find("#titleCtrl").val(tag.name);

			var btnOK = tagDlg.find(".btnOK");
			btnOK.off("click");

			btnOK.on("click", 
				function()
				{
					onTagOKClick(id, tag);
				});

			var btnCancel = tagDlg.find(".btnCancel");
			btnCancel.off("click");

			btnCancel.on("click", 
				function()
				{
					if (isNewEntry === true)
						id = 0;

					showTag(id);
				});

			showDialog(tagDlg);
		});
}

function resetTagDlg()
{
	var tagDlg = $("#tag");

	tagDlg.find("#titleCtrl").attr("readonly", true);

	tagDlg.find(".btnEdit, .btnClose").show();
	tagDlg.find(".btnOK, .btnCancel").hide();
}

function onTagEditClick()
{
	var tagDlg = $("#tag");

	tagDlg.find("#titleCtrl").removeAttr("readonly");

	tagDlg.find(".btnOK, .btnCancel").show();
	tagDlg.find(".btnEdit, .btnClose").hide();

	tagDlg.find("#titleCtrl").focus();
}

function onTagCloseClick()
{
	closeDialog($("#tag"));
	resetTagDlg();
}

function onTagOKClick(id, tag)
{
	var tagDlg = $("#tag");
	tag.name = tagDlg.find("#titleCtrl").val();

	chrome.runtime.sendMessage(
	{
		command: "updateTag",
		id: id,
		tag: tag,
	}, 
	function() 
    {
		showTag(id);
		fillTagContainers();

		refreshResultsView();
	});
}

function resetDayMenu()
{
	$("#recipeSuggestions").empty();
			
	$(".recipeEntry").remove();
	$(".addRecipeEntry").remove();
}

function onDayMenuCloseClick()
{
	closeDialog($("#dayMenu"));
	resetDayMenu();
}

function showDialog(dialogDiv)
{
	$("#dialogContainer").css("display", "flex").focus();
	dialogDiv.css("display", "flex");
}

function closeDialog(dialogDiv)
{
	$("#dialogContainer").hide();
	dialogDiv.hide();
}

function clearSearchBox()
{
	$("#searchBox").val("");
}
