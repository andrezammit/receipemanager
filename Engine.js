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
            function(error, token) 
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
            function(event, title)
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
            function(error, token) 
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
            function(error, file)
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

    function uploadDatabase(callback)
    {
        console.log("Starting database upload...");
        
        _googleDrive.files.create(
            {
                auth: _oAuth2Client,
                resource: 
                {
                    name: 'RecipeManager.json',
                    parents: [ 'appDataFolder']
                },
                media: 
                {
                    mimeType: 'application/json',
                    body: fs.createReadStream('RecipeManager.json') // read streams are awesome!
                },
                fields: 'id'  
            }, 
            function(error, file)
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

        uploadDatabase(callback)
        {
            uploadDatabase(callback);
        },

        getDateEntryById(id)
        {
            return getObjectById(id, RESULT_TYPE_DATEENTRY);
        }
    }
}