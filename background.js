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

    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});

    if (request.command == "search")
    {
      console.log("Search query: " + request.searchText);
      
      _db = request.db;

      var results = getSearchResults(request.searchText);
      sendResponse(results);
    }
  });

var _db = null;

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