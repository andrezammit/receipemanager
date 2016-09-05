var fs = require('fs');
var path = require('path');

var google = require('googleapis');
var googleAuth = require('google-auth-library');

const { BrowserWindow } = require('electron').remote;

function Engine()
{
    var _tokenDir = path.dirname(require.main.filename) + '/.credentials/';
    var _tokenPath = _tokenDir + 'GoogleAuth.json';

    var _clientId = "13277472194-s5rm0emfoq5fcfmqqlncjbejb5fhp42n.apps.googleusercontent.com";
    var _secret = "fBAQnEagqKhO0AUlXyEx6S26";
    //var _scopes = ["https://www.googleapis.com/auth/calendar.readonly"];
    var _scopes = ["https://www.googleapis.com/auth/drive.appdata"];

    var _googleAuth = new googleAuth();
    var _oAuth2Client = new _googleAuth.OAuth2(_clientId, _secret, "urn:ietf:wg:oauth:2.0:oob");

    var _googleDrive = google.drive('v3');

    var _currResults = 
    {
        books: [],
        sections: [],
        recipes: []
    };

    function checkAuth(callback) 
    {
        fs.readFile(_tokenPath,
            function (error, token) 
            {
                if (error) 
                {
                    console.log("Google authentication token not found.");
                    getNewToken(callback);
                }
                else 
                {
                    console.log("Google authentication token found.");

                    _oAuth2Client.credentials = JSON.parse(token);
                    onAuthReady(callback);
                }
            });
    }

    function getNewToken(callback)
    {
        var authUrl = _oAuth2Client.generateAuthUrl(
            {
                access_type: 'offline',
                scope: _scopes
            });

        console.log("Google authentication URL generated.");

        var oAuthWin = new BrowserWindow(
            {
                modal: true,
                width: 800,
                height: 600
            });

        oAuthWin.on('page-title-updated',
            function (event, title)
            {
                var pos = title.indexOf("code=");

                if (pos === -1)
                    return;

                console.log("Closing OAuth2 window.");
                oAuthWin.close();

                // skip "code="
                pos += 5;

                var authCode = title.substr(pos);
                console.log("Google authentication code detected: " + authCode);

                generateAuthToken(authCode, callback);
            });

        oAuthWin.loadURL(authUrl);
    }

    function generateAuthToken(authCode, callback)
    {
        _oAuth2Client.getToken(authCode,
            function (error, token) 
            {
                if (error) 
                {
                    console.log("Google authentication token error: ", error);
                    return;
                }

                storeAuthToken(token);

                _oAuth2Client.credentials = token;
                onAuthReady(callback);
            });
    }

    function storeAuthToken(token)
    {
        try 
        {
            fs.mkdirSync(_tokenDir);
        }
        catch (error) 
        {
            if (error.code != 'EEXIST')
                console.log("Google authentication token stored to " + _tokenPath + ". Error: " + error);
        }

        fs.writeFile(_tokenPath, JSON.stringify(token));
        console.log("Google authentication token stored to " + _tokenPath);
    }

    function onAuthReady(callback)
    {
        console.log("Google API authenticated.");
        callback();
    }

    function loadDatabase(callback)
    {
        //1AQdWGNuFJ_3pd6GW6QanfPFvR_2R0xg73JE-y9tAxtc
        console.log("Loading database from Google Drive...");

        _googleDrive.files.get(
            {
                auth: _oAuth2Client,
                fileId: "1AQdWGNuFJ_3pd6GW6QanfPFvR_2R0xg73JE-y9tAxtc",
                alt: 'media'
            },
            function (error, file)
            {
                if (error)
                {
                    console.log("Failed to load database. " + error);
                    return;
                }

                _db = file;
                console.log("Database loaded.");

                callback();
            });
    }

    function saveDatabase(callback)
    {
        console.log("Saving database to Google Drive...");
        uploadDatabase(_db, callback);
    }

    function getFileList()
    {
        _googleDrive.files.list(
            {
                auth: _oAuth2Client,
                spaces: 'appDataFolder',
                pageSize: 10,
                fields: "nextPageToken, files(id, name)"
            },
            function (error, response)
            {
                if (error)
                {
                    console.log("Google Drive API error: " + error);
                    return;
                }

                var files = response.files;

                for (var i = 0; i < files.length; i++) 
                {
                    var file = files[i];
                    console.log('%s (%s)', file.name, file.id);
                }
            });
    }

    function uploadDatabase(data, callback)
    {
        console.log("Starting database upload...");

        _googleDrive.files.create(
            {
                auth: _oAuth2Client,
                resource:
                {
                    name: 'RecipeManager.json',
                    parents: ['appDataFolder']
                },
                media:
                {
                    mimeType: 'application/json',
                    body: data
                },
                fields: 'id'
            },
            function (error, file)
            {
                if (error)
                {
                    console.log("Database upload failed. " + error);
                    return;
                }

                console.log("Database uploaded. ID: " + file.id);
                callback();
            });
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

    function sortTags(tags)
    {
        if (tags === null)
            return;

        tags.sort(
            function (a, b)
            {
                if (a.name < b.name)
                    return -1;

                if (a.name == b.name)
                    return 0;

                return 1;
            });
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
        sortRecipes(results.recipes);
        sortSections(results.sections);

        var recipes = results.recipes;
        results.recipes = [];

        groupRecipesBySection(recipes, results.recipes);

        var sections = results.sections;
        results.sections = [];

        groupSectionsByBook(sections, results.sections);

        return results;
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

    function copyObject(firstObj, secondObj)
    {
        for (var k in firstObj)
            firstObj[k] = secondObj[k];
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
            function (a, b)
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
            function (a, b)
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
            function (a, b)
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


    return {
        authenticate(callback)
        {
            callback = callback || null;
            checkAuth(callback);
        },

        loadDatabase(callback)
        {
            callback = callback || null;
            loadDatabase(callback);
        },

        saveDatabase(callback)
        {
            callback = callback || null;
            saveDatabase(callback);             
        },

        uploadDatabase(callback)
        {
            uploadDatabase(callback);
        },

        getDateEntryById(id)
        {
            return getObjectById(id, RESULT_TYPE_DATEENTRY);
        },

        getBookById(id)
        {
            return getObjectById(id, RESULT_TYPE_BOOK);
        },

        getSectionById(id)
        {
            return getObjectById(id, RESULT_TYPE_SECTION);
        },

        getAllBooks()
        {
            return getAllBooks();
        },

        getAllTags()
        {
            return getAllTags();
        },

        getBookSections(id)
        {
            return getBookSections(id);
        },

        getSectionRecipes(id)
        {
            return getSectionRecipes(id);
        },

        getTagRecipes(id)
        {
            var recipes = getTagRecipes(id, _db);
            groupRecipesBySection(recipes, _currResults.recipes);

            return getBunchOfResults();
        },

        getBunchOfResults()
        {
            return getBunchOfResults();
        },

        updateDateEntry(dateEntry)
        {
            updateDateEntry(dateEntry);
            saveDatabase();
        },

        updateBook(id, updatedBook)
        {
            updateBook(id, updatedBook);
            saveDatabase();
        },

        updateRecipe(id, updatedRecipe)
        {
            updateRecipe(id, updateRecipe);
            saveDatabase();
        },

        updateTag(id, updatedTag)
        {
            updateTag(id, updatedTag);
            saveDatabase();
        },

        updateSection(id, updatedSection, tagIdDiff)
        {
            updateSection(id, updatedSection, tagIdDiff);
            saveDatabase();
        },

        getSearchSuggestions(searchText)
        {
            return getSearchSuggestions(searchText);
        },
        
        search(searchText)
        {
            _currResults = getSearchResults(searchText);
            return getBunchOfResults();
        },

        deleteObject(id, type, removeFromParent)
        {
            deleteObject(id, type, removeFromParent);
            saveDatabase();
        }
    };
}