chrome.app.runtime.onLaunched.addListener(
	function() 
	{
  		chrome.app.window.create('index.html', 
  		{
    		"bounds": 
    		{
      			"width": 1110,
      			"height": 700,
            "left": 100,
            "top": 100
    		}
  		});
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) 
  {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");

    if (request.command == "search")
    {
      console.log("Search query: " + request.searchText);
      
      _db = request.db;

      _currResults = getSearchResults(request.searchText);
      sendResponse(getBunchOfResults());
    }
    else if (request.command == "getBunchOfResults")
    {
      sendResponse(getBunchOfResults());
    }
  });

var _db = null;
var _currResults = null;

function getBunchOfResults()
{
  var bunchOfResults = 
  {
    books: [],
    sections: [],
    recipes: []
  };

  var entriesLeft = 100;

  bunchOfResults.books = getBunchOfBooks(entriesLeft);
  bunchOfResults.sections = getBunchOfSections(entriesLeft);
  bunchOfResults.recipes = getBunchOfRecipes(entriesLeft);

  return bunchOfResults;
}

function getBunchOfBooks(entriesLeft)
{
  if (entriesLeft == 0 || _currResults.books == null)
    return null;

  var booksToReturn = Math.max(_currResults.books.length, entriesLeft);

  var bunchOfBooks = _currResults.books.splice(0, booksToReturn);
  entriesLeft -= booksToReturn;

  if (bunchOfBooks.length == 0)
    return null;

  return bunchOfBooks; 
}

function getBunchOfSections(entriesLeft)
{
  if (entriesLeft == 0 || _currResults.sections == null)
    return null;

  var bunchOfSections = [];

  for (var cnt = 0; cnt < _currResults.sections.length; cnt++)
  {
    var sectionGroup = _currResults.sections[cnt];

    if (sectionGroup.sections.length < entriesLeft)
    {
      bunchOfSections.push(sectionGroup);
      entriesLeft -= sectionGroup.sections.length;

      _currResults.sections.splice(0, 1);
      cnt--;

      continue;
    }

    var tempGroup = 
    {
      bookId: sectionGroup.bookId,
      sections: []
    };

    tempGroup.sections = sectionGroup.sections.splice(0, entriesLeft);
    entriesLeft = 0;

    bunchOfSections.push(tempGroup);
    break;
  }

  if (bunchOfSections.length == 0)
    return null;

  return bunchOfSections; 
}

function getBunchOfRecipes(entriesLeft)
{
    if (entriesLeft == 0 || _currResults.recipes == null)
    return null;

  var bunchOfRecipes = [];

  for (var cnt = 0; cnt < _currResults.recipes.length; cnt++)
  {
    var recipeGroup = _currResults.recipes[cnt];

    if (recipeGroup.recipes.length < entriesLeft)
    {
      bunchOfRecipes.push(recipeGroup);
      entriesLeft -= recipeGroup.recipes.length;

      _currResults.recipes.splice(0, 1);
      cnt--;

      continue;
    }

    var tempGroup = 
    {
      sectionId: recipeGroup.sectionId,
      recipes: []
    };

    tempGroup.recipes = recipeGroup.recipes.splice(0, entriesLeft);
    entriesLeft = 0;

    bunchOfRecipes.push(tempGroup);
    break;
  }

  if (bunchOfRecipes.length == 0)
    return null;

  return bunchOfRecipes; 
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
  var sections = [];

  var size = _db.books.length;
  for (var cnt = 0; cnt < size; cnt++)
  {
    var section = _db.sections[cnt];
    var sectionName = section.name.toLowerCase();
    
    if (sectionName.indexOf(searchText) == -1)
      continue;

    sections.push(section);
  }

  if (sections.length == 0)
    return null;

  var sectionGroups = [];
  groupSectionsByBook(sections, sectionGroups);

  return sectionGroups;
}

function getRecipeResults(searchText)
{
  var recipes = [];

  var size = _db.recipes.length;
  for (var cnt = 0; cnt < size; cnt++)
  {
    var recipe = _db.recipes[cnt];
    var recipeName = recipe.name.toLowerCase();
    
    if (recipeName.indexOf(searchText) == -1)
      continue;

    recipes.push(recipe);
  }

  if (recipes.length == 0)
    return null;

  var recipeGroups = [];
  groupRecipesBySection(recipes, recipeGroups);

  return recipeGroups;
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

function groupRecipesBySection(recipes, groups)
{
  var size = recipes.length;
  for (var cnt = 0; cnt < size; cnt++)
  {
    addRecipeToRecipeGroup(recipes[cnt], groups);
  }
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

function groupSectionsByBook(sections, groups)
{
  var size = sections.length;
  for (var cnt = 0; cnt < size; cnt++)
  {
    addSectionToSectionGroup(sections[cnt], groups);
  }
}