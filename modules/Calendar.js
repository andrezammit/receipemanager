const Calendar = (function () {
	var _currDate = getCurrentDate();

	function setHandlers() {
		$("#recipeContainer").sortable(
			{
				axis: "y",
				revert: true,
				scroll: false,
				cursor: "move",
				stop: onRecipeDragStopped,
				helper: "clone"
			});

		$("#prevMonth").on("click", onPrevMonthClick);
		$("#nextMonth").on("click", onNextMonthClick);
	}

	function getPrevMonthDate(date) {
		var prevMonthDate = new Date(date);

		if (date.getMonth() === 0) {
			var year = date.getFullYear();

			prevMonthDate.setYear(--year);
			prevMonthDate.setMonth(11);
		}
		else {
			var month = date.getMonth();
			prevMonthDate.setMonth(--month);
		}

		return prevMonthDate;
	}

	function getNextMonthDate(date) {
		var nextMonthDate = new Date(date);

		if (date.month == 11) {
			var year = date.getFullYear();

			nextMonthDate.setYear(++year);
			nextMonthDate.setMonth(0);
		}
		else {
			var month = date.getMonth();
			nextMonthDate.setMonth(++month);
		}

		return nextMonthDate;
	}

	function onPrevMonthClick() {
		_currDate = getPrevMonthDate(_currDate);
		fillCalendarView();
	}

	function onNextMonthClick() {
		_currDate = getNextMonthDate(_currDate);
		fillCalendarView();
	}

	function getCurrentDate() {
		return new Date();
	}

	function getDaysInMonth(month) {
		switch (month) {
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

	function getMonthName(month) {
		switch (month) {
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

	function getDayOfWeek(day, month, year) {
		var date = new Date(year, month, day, 1, 1, 1, 1);
		var weekDay = date.getDay();

		if (weekDay === 0)
			weekDay = 7;

		return weekDay;
	}

	function fillCalendarView(date) {
		date = date || _currDate;

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

		if ((totalDays / 7) < 6) {
			daysToAdd += 7;
			totalDays += 7;
		}

		if ((totalDays / 7) < 6) {
			firstDay += 7;
			totalDays += 7;
		}

		var prevMonthDate = getPrevMonthDate(date);
		var prevMonthDays = getDaysInMonth(prevMonthDate.getMonth());

		var dummyDay = null;

		for (var cnt = 0; cnt < firstDay; cnt++) {
			var prevMonthDay = prevMonthDays - (firstDay - cnt - 1);

			dummyDay = $("<div class='dayCell dummyDay'><div class='day'>" + prevMonthDay + "</div></div>");
			dummyDay.on("click", onPrevMonthClick);

			daysDiv.append(dummyDay);
		}

		var todayDate = new Date();

		for (cnt = 0; cnt < days; cnt++) {
			var day = cnt + 1;

			var dateData = new Date(date);
			dateData.setDate(day);

			var isToday = false;

			if (dateData.getDate() === todayDate.getDate() &&
				dateData.getMonth() === todayDate.getMonth() &&
				dateData.getFullYear() === todayDate.getFullYear()) {
				isToday = true;
			}

			var dayDiv = $("<div class='dayCell availDay'><div class='day'>" + day + "</div></div>");
			dayDiv.data("date", dateData);

			if (isToday)
				dayDiv.addClass("todayCell");

			dayDiv.on("click", onDayClicked);

			daysDiv.append(dayDiv);
		}

		for (cnt = 0; cnt < daysToAdd; cnt++) {
			dummyDay = $("<div class='dayCell dummyDay'><div class='day'>" + (cnt + 1) + "</div></div>");
			dummyDay.on("click", onNextMonthClick);

			daysDiv.append(dummyDay);
		}

		refreshDayRecipes();
	}

	function getDateIdFromDate(date) {
		return date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear();
	}

	function fillDayRecipes(dayDiv) {
		var date = dayDiv.data("date");
		var dateId = getDateIdFromDate(date);

		var dateEntry = Engine.getDateEntryById(dateId);

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

		if (maxRecipesToShow < dateEntry.recipes.length) {
			addMoreEntry = true;
			maxRecipesToShow--;
		}

		var dayViewRecipe = null;
		var recipesToShow = Math.min(dateEntry.recipes.length, maxRecipesToShow);

		for (var cnt = 0; cnt < recipesToShow; cnt++) {
			var recipe = dateEntry.recipes[cnt];

			dayViewRecipe = $("<div class='dayViewRecipe'>" + recipe.name + "</div>");
			dayDiv.append(dayViewRecipe);
		}

		if (addMoreEntry === true) {
			dayViewRecipe = $("<div class='dayViewRecipe'>More...</div>");
			dayDiv.append(dayViewRecipe);
		}

		$(".dayViewRecipe").css("width", dayDiv.width() - 16);

		var dayNumberDiv = dayDiv.children(".day");

		if (recipesToShow > 0) {
			dayNumberDiv.css("font-weight", "bold");
		}
		else {
			dayNumberDiv.css("font-weight", "normal");
		}
	}

	function refreshDayRecipes() {
		console.log("Loading calendar...");

		var dayDivs = $(".availDay");

		for (var cnt = 0; cnt < dayDivs.length; cnt++) {
			var dayDiv = $(dayDivs[cnt]);
			fillDayRecipes(dayDiv);
		}

		console.log("Calendar loaded.");
	}

	function onDayClicked(event) {
		var dayDiv = $(event.target);
		var date = dayDiv.data("date");

		var dateId = getDateIdFromDate(date);
		var dateEntry = Engine.getDateEntryById(dateId);

		if (dateEntry === null) {
			dateEntry = new DateEntry();
			dateEntry.id = dateId;
		}

		console.log(date.toString());

		var dayMenuDiv = $("#dayMenu");

		dayMenuDiv.data("dayDiv", dayDiv);
		dayMenuDiv.data("dateEntry", dateEntry);

		RecipeManager.showDialog(dayMenuDiv);

		$("#recipeSuggestions").empty();

		$(".recipeEntry").remove();
		$(".addRecipeEntry").remove();

		$("#dateHeader").text(date.toDateString());

		for (var cnt = 0; cnt < dateEntry.recipes.length; cnt++) {
			var recipe = dateEntry.recipes[cnt];
			addDateRecipeEntry(dateEntry, recipe);
		}

		var addRecipeEntry = $("<div class='addRecipeEntry'>Add Recipe...</div>");
		addRecipeEntry.on("click",
			function () {
				onAddRecipeEntryClick();
			});

		dayMenuDiv.append(addRecipeEntry);
	}

	function addRecipeSuggestion(recipeSuggestionsDiv, recipe) {
		var recipeSuggestionDiv = $("<div class='recipeSuggestion'>" + recipe.name + "</div>");

		var section = null;

		if (recipe.sectionId !== null)
			section = Engine.getSectionById(recipe.sectionId);

		if (section !== null)
			recipeSuggestionDiv.append($("<span class='recipeTooltip'>" + section.name.trim() + "; page: " + recipe.page + "</span>"));

		if (recipe.id === 0)
			recipeSuggestionDiv.addClass("recipeSuggestionHover");

		recipeSuggestionDiv.on("click",
			function (event) {
				$("#recipeSearch").val(recipe.name);
				$("#recipeSearch").data("recipeId", recipe.id);

				recipeSuggestionsDiv.hide();
				recipeSuggestionsDiv.children().removeClass("recipeSuggestionHover");

				$("#recipeSearch").focus();

				event.stopPropagation();
			});

		recipeSuggestionDiv.hover(
			function () {
				$("#recipeSuggestions").children().removeClass("recipeSuggestionHover");
				$(this).addClass("recipeSuggestionHover");
			},
			function () {
				$(this).removeClass("recipeSuggestionHover");
			});

		recipeSuggestionsDiv.append(recipeSuggestionDiv);
	}

	function showRecipeSuggestions(addRecipeInput, results) {
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
		for (var cnt = 0; cnt < size; cnt++) {
			var recipe = results.recipes[cnt];
			console.log(cnt + " - " + recipe.name);

			addRecipeSuggestion(recipeSuggestions, recipe);
		}
	}

	function onAddRecipeInputChanged(addRecipeInput) {
		var searchText = addRecipeInput.val();

		if (searchText === "") {
			$("#recipeSuggestions").empty();
			return;
		}

		var results = Engine.getRecipeSuggestions(searchText);
		showRecipeSuggestions(addRecipeInput, results);
	}

	function onAddRecipeEntryClick() {
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
				function () {
					onAddRecipeInputChanged(addRecipeInput);
				})
			.blur(
				function () {
					if ($("#recipeSuggestions").data("hovered") === true)
						return;

					addRecipeEntry.html("Add Recipe...");
					addRecipeEntry.data("inputState", false);

					addRecipeEntry.off("blur");
				})
			.keydown(
				function (event) {
					switch (event.keyCode) {
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

	function onRecipeSearchUpPressed() {
		var suggestionsDiv = $("#recipeSuggestions");
		var currentSuggestion = suggestionsDiv.find(".recipeSuggestionHover");

		if (currentSuggestion.length === 0)
			return;

		var prevSuggestion = null;
		if (currentSuggestion.prev().length === 0) {
			prevSuggestion = suggestionsDiv.find(":last-child");
		}
		else {
			prevSuggestion = currentSuggestion.prev();
		}

		if (currentSuggestion.length !== 0)
			currentSuggestion.removeClass("recipeSuggestionHover");

		prevSuggestion.focus();
		prevSuggestion.addClass("recipeSuggestionHover");
	}

	function onRecipeSearchDownPressed() {
		var suggestionsDiv = $("#recipeSuggestions");
		var currentSuggestion = suggestionsDiv.find(".recipeSuggestionHover");

		var nextSuggestion = null;
		if (currentSuggestion.length === 0 || currentSuggestion.next().length === 0) {
			nextSuggestion = suggestionsDiv.find(":first-child");
		}
		else {
			nextSuggestion = currentSuggestion.next();
		}

		if (currentSuggestion.length !== 0)
			currentSuggestion.removeClass("recipeSuggestionHover");

		nextSuggestion.focus();
		nextSuggestion.addClass("recipeSuggestionHover");
	}

	function onRecipeSearchEnterPressed() {
		var suggestionsDiv = $("#recipeSuggestions");
		var currentSuggestion = suggestionsDiv.find(".recipeSuggestionHover");

		if (currentSuggestion.length !== 0) {
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

		RecipeManager.showLoader();
		Engine.updateDateEntry(dateEntry, RecipeManager.hideLoader);

		addDateRecipeEntry(dateEntry, newDateRecipe);

		addRecipeInput.blur();

		suggestionsDiv.hide();
		suggestionsDiv.children().removeClass("recipeSuggestionHover");

		var dayDiv = dayMenuDiv.data("dayDiv");
		fillDayRecipes(dayDiv);
	}

	function addDateRecipeEntry(dateEntry, newDateRecipe) {
		var newRecipeEntry = $("<div class='recipeEntry'></div>");

		var recipe = Engine.getRecipeById(newDateRecipe.id);

		if (recipe !== null)
			newDateRecipe.name = recipe.name;

		var recipeEntryName = $("<div class='recipeEntryName'>" + newDateRecipe.name + "</div>");
		newRecipeEntry.append(recipeEntryName);

		var recipeEntryDelete = $("<div class='recipeEntryButton'><img src='images/delete.png' class='recipeEntryIcon'></div>");
		newRecipeEntry.append(recipeEntryDelete);

		if (recipe !== null) {
			var section = null;

			if (recipe.sectionId !== null)
				section = Engine.getSectionById(recipe.sectionId);

			if (section !== null)
				newRecipeEntry.append($("<span class='recipeTooltip'>" + section.name.trim() + "; page: " + recipe.page + "</span>"));
		}

		recipeEntryDelete.on("click",
			function () {
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

		recipeEntryName.quickfit(
			{
				max: 22
			});
	}

	function onRecipeEntryClick(event) {
		var recipeEntry = $(event.target).parent();

		var recipe = recipeEntry.data("recipe");

		if (recipe.id !== 0)
			RecipeManager.showRecipe(recipe.id);
	}

	function onRecipeDragStopped(e, ui) {
		var nextRecipe = null;
		var nextRecipeDiv = ui.item.next();

		if (nextRecipeDiv.length === 0)
			return;

		nextRecipe = nextRecipeDiv.data("recipe");

		var recipe = ui.item.data("recipe");
		moveRecipeInDateEntry(recipe, nextRecipe);

		e.stopPropagation();

		var dayMenuDiv = $("#dayMenu");
		var dayDiv = dayMenuDiv.data("dayDiv");

		fillDayRecipes(dayDiv);
	}

	function moveRecipeInDateEntry(recipeToMove, nextRecipe) {
		var dayMenuDlg = $("#dayMenu");
		var dateEntry = dayMenuDlg.data("dateEntry");

		var recipe = null;

		for (var cnt = 0; cnt < dateEntry.recipes.length; cnt++) {
			recipe = dateEntry.recipes[cnt];

			if (recipe === recipeToMove) {
				dateEntry.recipes.splice(cnt, 1);
				break;
			}
		}

		for (cnt = 0; cnt < dateEntry.recipes.length; cnt++) {
			recipe = dateEntry.recipes[cnt];

			if (recipe === nextRecipe) {
				dateEntry.recipes.splice(cnt, 0, recipeToMove);
				break;
			}
		}

		RecipeManager.showLoader();
		Engine.updateDateEntry(dateEntry, RecipeManager.hideLoader);
	}

	function removeRecipeFromDateEntry(dateEntry, recipeToRemove) {
		for (var cnt = 0; cnt < dateEntry.recipes.length; cnt++) {
			var recipe = dateEntry.recipes[cnt];

			if (recipe === recipeToRemove) {
				dateEntry.recipes.splice(cnt, 1);
				break;
			}
		}

		RecipeManager.showLoader();
		Engine.updateDateEntry(dateEntry, RecipeManager.hideLoader);
	}

	function syncCalendar() {
		var month = _currDate.getMonth();
		var year = _currDate.getFullYear();

		RecipeManager.showLoader();

		Engine.syncCalendar(month, year,
			function () {
				RecipeManager.hideLoader();
			}
		);
	}

	return {
		setHandlers: function () {
			setHandlers();
		},

		fillCalendarView: function (date) {
			fillCalendarView(date);
		},

		refreshDayRecipes: function () {
			refreshDayRecipes();
		},

		syncCalendar: function () {
			syncCalendar();
		}
	}
})();
