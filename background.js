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
/* globals window */
/* globals FileReader */

chrome.app.runtime.onLaunched.addListener(
	function() 
	{
  		chrome.app.window.create("index.html", 
  		{
    		"bounds": 
    		{
                "width": Math.round(window.screen.availWidth * 0.8),
                "height": Math.round(window.screen.availHeight * 0.8)
            }
  		});
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) 
    {
        switch (request.command)
        {
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

            case "saveDatabase":
            {
                saveDatabase(
                    function()
                    {
                        sendResponse();
                    });

                return true;
            }
            break;

            case "getDatabaseData":
            {
                sendResponse(_db);
                return true;
            }

            case "importDatabase":
            {
                importDatabase(request.data,
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

                saveDatabase();
                sendResponse();
            }
            break;

            case "updateSection":
            {
                updateSection(request.id, request.section, request.tagIdDiff);
                
                saveDatabase();
                sendResponse();
            }
            break;

            case "updateTag":
            {
                updateTag(request.id, request.tag);
                
                saveDatabase();
                sendResponse();
            }
            break;

            case "updateDateEntry":
            {
                updateDateEntry(request.dateEntry);
                
                saveDatabase();
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
                deleteObject(request.id, request.type, request.removeFromParent);
                
                saveDatabase();
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
    console.log("loading tags...");

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
        
        do
        {
            index = book.sectionIds.indexOf(id);

            if (index == -1)
                continue;

            book.sectionIds.splice(index, 1); 
        }
        while (index != -1);
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

        do
        {
            index = section.recipeIds.indexOf(id);

            if (index == -1)
                continue;

            section.recipeIds.splice(index, 1);    
        }
        while (index != -1);
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
    else if (searchText == "#3stars")
    {
        recipes = getStarredRecipes(results, 3);
    }
    else if (searchText == "#2stars")
    {
        recipes = getStarredRecipes(results, 2);
    }
    else if (searchText == "#1star")
    {
        recipes = getStarredRecipes(results, 1);
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

function getStarredRecipes(results, stars)
{
    var recipes = [];

    for (var cnt = 0; cnt < results.recipes.length; cnt++)
    {
        var recipe = results.recipes[cnt];

        if (recipe.rating === stars)
            recipes.push(recipe);
    }

    return recipes;
}

function getCookedRecipes(results)
{
    var recipes = [];

    for (var cnt = 0; cnt < results.recipes.length; cnt++)
    {
        var recipe = results.recipes[cnt];

        if (recipe.isCooked === 1 || recipe.isCooked === true)
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

        if (recipe.isInteresting === 1 || recipe.isInteresting === true)
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
