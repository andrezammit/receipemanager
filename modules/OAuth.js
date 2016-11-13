const { BrowserWindow } = require('electron').remote;

var fs = require('fs');
var googleAuth = require('google-auth-library');

var Defines = require('./Defines.js');

var _clientId = "13277472194-s5rm0emfoq5fcfmqqlncjbejb5fhp42n.apps.googleusercontent.com";
var _secret = "fBAQnEagqKhO0AUlXyEx6S26";

var _scopes = ["https://www.googleapis.com/auth/drive.appdata", "https://www.googleapis.com/auth/calendar"];

var _googleAuth = new googleAuth();
var _oAuth2Client = new _googleAuth.OAuth2(_clientId, _secret, "urn:ietf:wg:oauth:2.0:oob");

var _token = null;

function checkAuth(mainWindow, callback) 
{
    fs.readFile(Defines.getTokenPath(),
        function (error, token) 
        {
            if (error) 
            {
                console.log("Google authentication token not found.");
                getNewToken(mainWindow, callback);
            }
            else 
            {
                console.log("Google authentication token found.");

                _token = JSON.parse(token);
                _oAuth2Client.credentials = JSON.parse(token);

                _oAuth2Client.setCredentials(
                {
                    refresh_token: _token.refresh_token
                });

                _oAuth2Client.refreshAccessToken(
                    function (error, token)
                    {
                        if (error !== null)
                            storeAuthToken(token);
                    });

                onAuthReady(callback);
            }
        });
}

function getNewToken(mainWindow, callback)
{
    var authUrl = _oAuth2Client.generateAuthUrl(
        {
            access_type: 'offline',
            scope: _scopes
        });

    console.log("Google authentication URL generated.");

    var oAuthWin = new BrowserWindow(
        {
            parent: mainWindow,
            alwaysOnTop: true,
            modal: true,
            width: 800,
            height: 600
        });

    oAuthWin.setMenu(null);

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
    fs.writeFile(Defines.getTokenPath(), JSON.stringify(token),
        function (error)
        {
            if (error !== null)
            {
                console.log("Failed to store Google authentication token. " + error);
                return;
            }

            console.log("Google authentication token stored to " + Defines.getTokenPath());
        });
}

function onAuthReady(callback)
{
    console.log("Google API authenticated.");
    callback();
}

exports.checkAuth = checkAuth;

exports.getClient =
    function ()
    {
        return _oAuth2Client;
    };
