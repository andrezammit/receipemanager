"use strict";

/* globals RESULT_TYPE_BOOK */
/* globals RESULT_TYPE_SECTION */
/* globals RESULT_TYPE_RECIPE */
/* globals RESULT_TYPE_TAG */
/* globals RESULT_TYPE_DATEENTRY */

/* globals Recipe */
/* globals Book */
/* globals Section */
/* globals Tag */
/* globals DateEntry */

/* globals _db */

chrome.app.runtime.onLaunched.addListener(
	function() 
	{
  		chrome.app.window.create("index.html", 
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
        switch (request.command)
        {
            case "search":
            {
                console.log("Search query: " + request.searchText);
                  
                _currResults = getSearchResults(request.searchText);
                sendResponse(getBunchOfResults());
            }
            break;

            case "getBunchOfResults":
            {
                sendResponse(getBunchOfResults());
            }
            break;

            case "getAllBooks":
            {
                sendResponse(getAllBooks());
            }
            break;

            case "getAllTags":
            {
                sendResponse(getAllTags());
            }
            break;

            case "getBookSections":
            {
                sendResponse(getBookSections(request.id));
            }
            break;

            case "getSectionRecipes":
            {
                sendResponse(getSectionRecipes(request.id));
            }
            break;

            case "loadDatabase":
            {
                loadDatabase(
                    function()
                    {
                        sendResponse();
                    });

                return true;
            }
            break;

            case "updateRecipe":
            {
                updateRecipe(request.id, request.recipe);
                sendResponse();
            }
            break;

            case "updateSection":
            {
                updateSection(request.id, request.section, request.tagIdDiff);
                sendResponse();
            }
            break;

            case "updateBook":
            {
                updateBook(request.id, request.book);
                sendResponse();
            }
            break;

            case "updateTag":
            {
                updateTag(request.id, request.tag);
                sendResponse();
            }
            break;

            case "updateDateEntry":
            {
                updateDateEntry(request.dateEntry);
                sendResponse();
            }
            break;

            case "getObjectById":
            {
                var object = getObjectById(request.id, request.type);
                sendResponse(object);
            }
            break;

            case "getNextAvailableId":
            {
                var id = getNextAvailableId(request.type);
                sendResponse(id);
            }
            break;

            case "deleteObject":
            {
                deleteObject(request.id, request.type);
                sendResponse();
            }
            break;

            case "getTagRecipes":
            {
                var recipes = getTagRecipes(request.id, _db);
                groupRecipesBySection(recipes, _currResults.recipes);

                sendResponse(getBunchOfResults());
            }
            break;

            case "getSearchSuggestions":
            {
                sendResponse(getSearchSuggestions(request.searchText));
            }
            break;

            case "getRecipeSuggestions":
            {
                sendResponse(getRecipeSuggestions(request.searchText));
            }
            break;
        }
  });

var _currResults = 
    {
        books: [],
        sections: [],
        recipes: []
    };

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
    if (entriesLeft === 0 || _currResults.books === null)
        return null;

    var booksToReturn = Math.max(_currResults.books.length, entriesLeft);

    var bunchOfBooks = _currResults.books.splice(0, booksToReturn);
    entriesLeft -= booksToReturn;

    if (bunchOfBooks.length === 0)
        return null;

    return bunchOfBooks; 
}

function getBunchOfSections(entriesLeft)
{
    if (entriesLeft === 0 || _currResults.sections === null)
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

    if (bunchOfSections.length === 0)
        return null;

    return bunchOfSections; 
}

function getBunchOfRecipes(entriesLeft)
{
    if (entriesLeft === 0 || _currResults.recipes === null)
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

    if (bunchOfRecipes.length === 0)
        return null;

    return bunchOfRecipes; 
}

function getBookResults(searchText, results)
{
    if (results.books === null)
        return null;

    var bookResults = [];

    var size = results.books.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var book = results.books[cnt];
        var bookName = book.name.toLowerCase();

        if (bookName.indexOf(searchText) == -1)
          continue;

        bookResults.push(book);
    }

    if (bookResults.length === 0)
        return null;

    return bookResults;
}

function getSectionResults(searchText, results)
{
    if (results.sections === null)
        return null;

    var sections = [];

    var size = results.sections.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var section = results.sections[cnt];
        var sectionName = section.name.toLowerCase();

        if (sectionName.indexOf(searchText) == -1)
            continue;

        sections.push(section);
    }

    if (sections.length === 0)
        return null;

    return sections;
}

function getRecipeResults(searchText, results)
{
    if (results.recipes === null)
        return null;

    var recipes = [];

    var size = results.recipes.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var recipe = results.recipes[cnt];
        var recipeName = recipe.name.toLowerCase();

        if (recipeName.indexOf(searchText) == -1)
          continue;

        recipes.push(recipe);
    }

    if (recipes.length === 0)
        return null;

    return recipes;
}

function getSearchResults(searchText)
{
    var results = 
    { 
        books: _db.books,
        sections: _db.sections,
        recipes: _db.recipes
    };

    searchText = searchText.toLowerCase();

    var filters = searchText.split(", ");

    var size = filters.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var filter = filters[cnt];

        if (filter[0] == "#")
        {
            results.recipes = getTagResults(filter, results);

            results.books = [];
            results.sections = [];

            continue;
        }

        results.books = getBookResults(filter, results);
        results.sections = getSectionResults(filter, results);
        results.recipes = getRecipeResults(filter, results);
    }

    sortBooks(results.books);
    sortRecipes(results.sections);
    sortSections(results.sections);

    var recipes = results.recipes;
    results.recipes = [];

    groupRecipesBySection(recipes, results.recipes);

    var sections = results.sections;
    results.sections = [];

    groupSectionsByBook(sections, results.sections);

    return results;
}

function groupRecipesBySection(recipes, groups)
{
    if (recipes === null)
        return;

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

  if (groupToAddTo === null)
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
    if (recipes === null)
        return;

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

function sortBooks(books)
{
    if (books === null)
        return;

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
    if (sections === null)
        return;

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

function sortTags(tags)
{
    if (tags === null)
        return;

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

  if (groupToAddTo === null)
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
    if (sections === null)
        return;

    var size = sections.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        addSectionToSectionGroup(sections[cnt], groups);
    }
}

function getAllBooks()
{
    var results = { books: _db.books };

    sortBooks(results.books);

    if (results.books.length === 0)
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

    sortTags(results.tags);

    if (results.tags.length === 0)
    {
        var tag = new Tag();
        tag.name = "Add tag...";

        results.tags.push(tag);
    }

    return results;
}

function getBookSections(id)
{
    var book = getBookById(id);
    var sections = [];

    var section = null;

    var size = book.sectionIds.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var sectionID = book.sectionIds[cnt];
        section = getSectionById(sectionID);

        if (section !== null)
            sections.push(section);
    }

    if (sections.length === 0)
    {
        section = new Section();

        section.bookId = id;
        section.name = "Add section...";

        sections.push(section);
    }

    sortSections(sections);

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

    var recipe = null;

    var size = section.recipeIds.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var recipeID = section.recipeIds[cnt];
        recipe = getRecipeById(recipeID);

        if (recipe !== null)
            recipes.push(recipe);
    }

    if (recipes.length === 0)
    {
        recipe = new Recipe();

        recipe.sectionId = id;
        recipe.name = "Add recipe...";

        recipes.push(recipe);
    }

    sortRecipes(recipes);

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

function getTagIdByName(name)
{
    var size = _db.tags.length;
    for (var cnt = 0; cnt < size; cnt++) 
    {
        var tag = _db.tags[cnt];

        if (tag.name.toLowerCase() == name.toLowerCase())
            return tag.id;
    }

    return -1;
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

        case RESULT_TYPE_DATEENTRY:
            array = _db.calendar;
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

    var isIdAvailable = false;
    var id = array[array.length - 1].id;

    do
    {
        id++;
        isIdAvailable = getObjectById(id, type) === null;
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
    var isNewRecipe = recipe === null;

    if (isNewRecipe === true)
        recipe = new Recipe();

    copyObject(recipe, updatedRecipe);

    if (isNewRecipe === true)
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
    var isNewSection = section === null;

    if (isNewSection === true)
        section = new Section();

    copyObject(section, updatedSection);

    if (isNewSection === true)
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

        var tagId = null;
        var index = null;

        for (var j = 0; j < tagIdDiff.added.length; j++)
        {
            tagId = tagIdDiff.added[j];
            index = recipe.tagIds.indexOf(tagId);

            if (index != -1)
                continue;

            recipe.tagIds.push(tagId);
        }

        for (var k = 0; k < tagIdDiff.removed.length; k++)
        {
            tagId = tagIdDiff.added[k];
            index = recipe.tagIds.indexOf(tagId);

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
    var isNewBook = book === null;

    if (isNewBook === true)
    {
        book = new Book();
        _db.books.push(book);
    }

    copyObject(book, updatedBook);
}

function updateTag(id, updatedTag)
{
    var tag = getTagById(id);
    var isNewTag = tag === null;

    if (isNewTag === true)
    {
        tag = new Tag();
        _db.tags.push(tag);
    }

    copyObject(tag, updatedTag);
}

function getTagRecipes(id, results)
{
    var tag = getTagById(id);
    var recipes = [];

    var size = tag.recipeIds.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var recipeID = tag.recipeIds[cnt];
        var recipe = getRecipeById(recipeID);

        if (recipe !== null)
        {
            if (results.recipes.indexOf(recipe) != -1)
                recipes.push(recipe);
        }
    }

    sortRecipes(recipes);
    return recipes;
}

function onFileNotFound()
{
}

function loadDatabase(onLoadDatabaseDone)
{
    chrome.syncFileSystem.requestFileSystem(
        function (fs) 
        {
            fs.root.getFile("RecipeManager-OldDB.json", 
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
            var fileReader = new FileReader();

            fileReader.onload = 
                function(event) 
                { 
                    var data = event.target.result;
                    var dataObj = JSON.parse(data);

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

        if (recipe !== null)
            recipe.tagIds.push(recipeTag[1]);

        var tag = getTagById(recipeTag[1]);

        if (tag !== null)
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

        if (section !== null)
        {
            section.tagIds.push(sectionTag[1]);
            setTagInSectionRecipes(section, sectionTag[1]);
        }   

        var tag = getTagById(sectionTag[1]);

        if (tag !== null)
            tag.sectionIds.push(sectionTag[0]);
    }
}

function setTagInSectionRecipes(tagId, sectionId)
{
    var section = getSectionById(sectionId);

    if (section === null)
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

        if (section !== null)
            section.recipeIds.push(sectionRecipe[1]);

        var recipe = getRecipeById(sectionRecipe[1]);

        if (recipe !== null)
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

        if (book !== null)
            book.sectionIds.push(bookSection[1]);

        var section = getSectionById(bookSection[1]);

        if (section !== null)
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
            deleteBook(id);
            break;

        case RESULT_TYPE_TAG:
            deleteTag(id);
            break;
    }
}

function deleteSection(id, removeFromBook)
{
    var section = getSectionById(id);

    if (section === null)
        return;

    var size = section.recipeIds.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var recipeId = section.recipeIds[cnt];
        deleteRecipe(recipeId, false);
    }

    var index = null;

    if (removeFromBook === true)
    {
        var bookId = section.bookId;
        var book = getBookById(bookId);
           
        index = book.sectionIds.indexOf(id);

        if (index != -1)
            book.sectionIds.splice(index, 1);
    }

    index = _db.sections.indexOf(section);

    if (index != -1)
        _db.sections.splice(index, 1);
}

function deleteBook(id)
{
    var book = getBookById(id);

    if (book === null)
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

function deleteTag(id)
{
    var tag = getTagById(id);

    if (tag === null)
        return;

    var index = null;

    var size = tag.sectionIds.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var sectionId = tag.sectionIds[cnt];
        
        var section = getSectionById(sectionId);

        if (section === null)
            continue;

        index = section.tagIds.indexOf(id);
        section.tagIds.splice(index, 1);
    }

    size = tag.recipeIds.length;
    for (cnt = 0; cnt < size; cnt++)
    {
        var recipeId = tag.recipeIds[cnt];
        
        var recipe = getRecipeById(recipeId);

        if (recipe === null)
            continue;

        index = recipe.tagIds.indexOf(id);
        recipe.tagIds.splice(index, 1);
    }

    index = _db.tags.indexOf(tag);

    if (index != -1)
        _db.tags.splice(index, 1);
}

function deleteRecipe(id, removeFromSection)
{
    var recipe = getRecipeById(id);

    if (recipe === null)
        return;

    recipe.tagIds.splice(0, recipe.tagIds.length);
    updateTagRecipeReferences(recipe);

    var index = null;

    if (removeFromSection === true)
    {
        var sectionId = recipe.sectionId;
        var section = getSectionById(sectionId);

        index = section.recipeIds.indexOf(id);

        if (index != -1)
            section.recipeIds.splice(index, 1);
    }
    
    index = _db.recipes.indexOf(recipe);

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
    var index = tag.recipeIds.indexOf(recipeId);

    if (index == -1)
        return;

    tag.recipeIds.splice(index, 1);
}

function addRecipeToTag(tag, recipeId)
{
    var index = tag.recipeIds.indexOf(recipeId);

    if (index != -1)
        return;

    tag.recipeIds.push(recipeId);
}

function getTagResults(searchText, results)
{
    var recipes = null;

    if (searchText == "#cooked")
    {
        recipes = getCookedRecipes(results);
    }
    else if (searchText == "#interesting")
    {
        recipes = getInterestingRecipes(results);
    }
    else 
    {
        var name = searchText.substring(1);
        var id = getTagIdByName(name);

        if (id != -1)
            recipes = getTagRecipes(id, results);
    }

    return recipes;
}

function getCookedRecipes(results)
{
    var recipes = [];

    for (var cnt = 0; cnt < results.recipes.length; cnt++)
    {
        var recipe = results.recipes[cnt];

        if (recipe.isCooked === 1)
            recipes.push(recipe);
    }

    return recipes;
}

function getInterestingRecipes()
{
    var recipes = [];

    for (var cnt = 0; cnt < _db.recipes.length; cnt++)
    {
        var recipe = _db.recipes[cnt];

        if (recipe.isInteresting === 1)
            recipes.push(recipe);
    }

    return recipes;
}

function searchTags(searchText)
{
    var tags = [];

    var size = _db.tags.length;
    for (var cnt = 0; cnt < size; cnt++)
    {
        var tag = _db.tags[cnt];
        var tagName = tag.name.toLowerCase();

        if (tagName.indexOf(searchText) == -1)
            continue;

        tags.push(tag);
    }

    return tags;
}

function searchRecipes(searchText)
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

    return recipes;
}

function getSearchSuggestions(searchText)
{
    var filters = searchText.split(", ");
    searchText = filters[filters.length - 1];

    if (searchText[0] === "#")
        searchText = searchText.substring(1);
    
    searchText = searchText.toLowerCase();

    var tags = searchTags(searchText);

    var tagsToReturn = Math.min(tags.length, 5);
    tags = tags.splice(0, tagsToReturn);

    var results = 
    { 
        tags: tags,
    };

    return results;
}

function getRecipeSuggestions(searchText)
{
    searchText = searchText.toLowerCase();

    var recipes = searchRecipes(searchText);

    var recipesToReturn = Math.min(recipes.length, 5);
    recipes = recipes.splice(0, recipesToReturn);

    var results = 
    { 
        recipes: recipes,
    };

    return results;
}

function updateDateEntry(updatedDateEntry)
{
    var dateEntry = getObjectById(updatedDateEntry.id, RESULT_TYPE_DATEENTRY);
    var isNewDateEntry = dateEntry === null;

    if (isNewDateEntry === true)
    {
        dateEntry = new DateEntry();
        _db.calendar.push(dateEntry);
    }

    copyObject(dateEntry, updatedDateEntry);
}