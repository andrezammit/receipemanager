var google = require('googleapis');
var googleAuth = require('google-auth-library');

const { BrowserWindow } = require('electron').remote

function Engine()
{
    var _clientId = "13277472194-s5rm0emfoq5fcfmqqlncjbejb5fhp42n.apps.googleusercontent.com";
    var _secret = "fBAQnEagqKhO0AUlXyEx6S26";
    //var _scopes = ["https://www.googleapis.com/auth/calendar.readonly"];
    var _scopes = ["https://www.googleapis.com/auth/drive.metadata.readonly"];

    var _googleAuth = new googleAuth();
    var _oAuth2Client = new _googleAuth.OAuth2(_clientId, _secret, "urn:ietf:wg:oauth:2.0:oob");

    function checkAuth() 
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

                generateAuthToken(authCode);
            });

        oAuthWin.loadURL(authUrl);
    }

    function generateAuthToken(authCode)
    {
        _oAuth2Client.getToken(authCode, 
            function(error, token) 
            {
                if (error) 
                {
                    console.log('Google access token error: ', error);
                    return;
                }

                _oAuth2Client.credentials = token;
                onAuthResult();
            });
    }

    function onAuthResult() 
    {
       console.log("Google API authenticated.");
       getFileList();
    }

    function getFileList()
    {
        var googleDrive = google.drive('v3');

        googleDrive.files.list(
            {
                auth: _oAuth2Client,
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

    return {
        authenticate(callback)
        {
            callback = callback || null;

            checkAuth();

            //callback()
        },

        loadDatabase(callback)
        {
            callback = callback || null;

            callback()
        }
    }
}