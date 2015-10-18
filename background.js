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
      
      _currResults = getSearchResults(request.searchText);
      sendResponse(getBunchOfResults());
    }
    else if (request.command == "getBunchOfResults")
    {
        sendResponse(getBunchOfResults());
    }
    else if (request.command == "getAllBooks")
    {
        sendResponse(getAllBooks());
    }
    else if (request.command == "getAllTags")
    {
        sendResponse(getAllTags());
    }
    else if (request.command == "getBookSections")
    {
        sendResponse(getBookSections(request.id));
    }
    else if (request.command == "getSectionRecipes")
    {
        sendResponse(getSectionRecipes(request.id));
    }
    else if (request.command == "loadDatabase")
    {
        loadDatabase(
            function()
            {
                sendResponse();
            });

        return true;
    }
    else if (request.command == "updateRecipe")
    {
        updateRecipe(request.id, request.recipe);
        sendResponse();
    }
    else if (request.command == "updateSection")
    {
        updateSection(request.id, request.section, request.tagIdDiff);
        sendResponse();
    }
    else if (request.command == "updateBook")
    {
        updateBook(request.id, request.book);
        sendResponse();
    }
    else if (request.command == "updateTag")
    {
        updateTag(request.id, request.tag);
        sendResponse();
    }
    else if (request.command == "getObjectById")
    {
        var object = getObjectById(request.id, request.type);
        sendResponse(object);
    }
    else if (request.command == "getNextAvailableId")
    {
        var id = getNextAvailableId(request.type);
        sendResponse(id);
    }
    else if (request.command == "deleteObject")
    {
        deleteObject(request.id, request.type);
        sendResponse();
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

function getAllBooks()
{
    var results = { books: _db.books };

    if (results.books.length == 0)
    {
        var book = new Book();
        book.name = "Add book...";

        results.books.push(book);
    }

    return results;
}

function getAllTags()
{
    var results = { tags: _db.tags };

    if (results.tags.length == 0)
    {
        var book = new Tag();
        tag.name = "Add tag...";

        results.tags.push(book);
    }

    return results;
}

function getBookSections(id)
{
    var book = getBookById(id);
    var sections = [];

    var size = book.sectionIds.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var sectionID = book.sectionIds[cnt];
        var section = getSectionById(sectionID);

        if (section != null)
            sections.push(section);
    }

    if (sections.length == 0)
    {
        var section = new Section();

        section.bookId = id;
        section.name = "Add section...";

        sections.push(section);
    }

    var sectionGroups = [];
    groupSectionsByBook(sections, sectionGroups);

    var results = 
    { 
        sections: sectionGroups,
    };

    return results;
}

function getSectionRecipes(id)
{
    var section = getSectionById(id);
    var recipes = [];

    var size = section.recipeIds.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var recipeID = section.recipeIds[cnt];
        var recipe = getRecipeById(recipeID);

        if (recipe != null)
            recipes.push(recipe);
    }

    if (recipes.length == 0)
    {
        var recipe = new Recipe();

        recipe.sectionId = id;
        recipe.name = "Add recipe...";

        recipes.push(recipe);
    }

    var recipeGroups = [];
    groupRecipesBySection(recipes, recipeGroups);

    var results = 
    { 
        recipes: recipeGroups,
    };

    return results;
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

function copyObject(firstObj, secondObj)
{
    for (var k in firstObj) 
        firstObj[k] = secondObj[k];
}

function updateRecipe(id, updatedRecipe)
{
    var recipe = getRecipeById(id);
    var isNewRecipe = recipe == null;

    copyObject(recipe, updatedRecipe);

    if (isNewRecipe == true)
    {
        var section = getSectionById(recipe.sectionId);

        section.recipeIds.push(id);
        _db.recipes.push(recipe);
    }

    updateTagRecipeReferences(recipe);
}

function updateSection(id, updatedSection, tagIdDiff)
{
    var section = getSectionById(id);
    var isNewSection = section == null;

    copyObject(section, updatedSection);

    if (isNewSection == true)
    {
        var book = getBookById(section.bookId);

        book.sectionIds.push(id);
        _db.sections.push(section);
    }

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

function updateBook(id, updatedBook)
{
    var book = getBookById(id);
    var isNewBook = book == null;

    if (isNewBook == true)
    {
        _db.books.push(book);
    }

    copyObject(book, updatedBook);
}

function updateTag(id, updatedTag)
{
    var tag = getTagById(id);
    var isNewTag = tag == null;

    if (isNewTag == true)
    {
        _db.tags.push(tag);
    }

    copyObject(tag, updatedTag);
}

function onFileNotFound(error)
{
}

function loadDatabase(onLoadDatabaseDone)
{
    chrome.syncFileSystem.requestFileSystem(
        function (fs) 
        {
            fs.root.getFile('RecipeManager-OldDB.json', 
                { create: false }, 
                function(dataFileEntry)
                {
                    onDBFileFound(dataFileEntry, onLoadDatabaseDone); 
                },
                onFileNotFound);
        });
}

function onDBFileFound(dataFileEntry, onLoadDatabaseDone)
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

                    onLoadDatabaseDone();
                };  

            fileReader.readAsText(dataFile, "UTF-8");
        });
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

function deleteObject(id, type, removeFromParent)
{
    switch (type)
    {
        case RESULT_TYPE_RECIPE:
            deleteRecipe(id, removeFromParent);
            break;

        case RESULT_TYPE_SECTION:
            deleteSection(id, removeFromParent);
            break;

        case RESULT_TYPE_BOOK:
            deletebook(id);
            break;

        case RESULT_TYPE_TAG:
            array = _db.tags;
            break;
    }
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