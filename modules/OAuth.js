const OAuth = (function ()
{
    const _clientId = "13277472194-1hhadv632f58o9gc5qemlldtju2b4bmr.apps.googleusercontent.com";
    const _secret = "AIzaSyDM-3uG7lYaxci07SpySBNka3tYD47MpGE";

    const _scopes = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar";
    const _discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

    function initClient(callback)
    {
        let authObj = {
            apiKey: _secret,
            clientId: _clientId,
            discoveryDocs: _discoveryDocs,
            scope: _scopes
        };

        gapi.client.init(authObj).then(
            function () {
                let authInstance = gapi.auth2.getAuthInstance();
                authInstance.isSignedIn.listen(onSignedInUpdated);

                if (authInstance.isSignedIn.get() === true) {
                    callback(null);
                    return;
                }

                authInstance.signIn();
            }, function (error) {
                callback(error);
            });

        function onSignedInUpdated(isSignedIn) {
            if (isSignedIn) {
                callback(null);
            }
        }
    }

    function authenticate(callback)
    {
        gapi.load('client:auth2',
            function ()
            {
                initClient(callback)
            });
    }

    return {
        authenticate: function (callback) {
            authenticate(callback);
        }
    }
})();
