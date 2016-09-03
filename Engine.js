var fs = require('fs');
var path = require('path');

var google = require('googleapis');
var googleAuth = require('google-auth-library');

const { BrowserWindow } = require('electron').remote

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

                console.log("Closing OAuth2 window.")
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
            }
        )
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

        updateDateEntry(dateEntry)
        {
            updateDateEntry(dateEntry);
        },

        getSearchSuggestions(searchText)
        {
            return getSearchSuggestions(searchText);
        },
        
        search(searchText)
        {
            _currResults = getSearchResults(searchText);
            return getBunchOfResults();
        }
    }
}