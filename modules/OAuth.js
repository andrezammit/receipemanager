const OAuth = (function ()
{
    // const _clientId = "13277472194-1hhadv632f58o9gc5qemlldtju2b4bmr.apps.googleusercontent.com";
    const _clientId = "13277472194-hs9hse9r1oc5tkr65si7uma916r1nenu.apps.googleusercontent.com";

    const _scopes = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar";
    const _discoveryDocs = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

    let tokenClient;

    function initClient(callback)
    {
        const authObj = {
            discoveryDocs: _discoveryDocs,
        };

        gapi.client.init(authObj).then(
            function () {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    scope: _scopes,
                    client_id: _clientId,
                    callback: onSignedInUpdated
                });

                if (gapi.client.getToken() === null) {
                    tokenClient.requestAccessToken({prompt: 'consent'});
                } else {
                    tokenClient.requestAccessToken({prompt: ''});
                }
            }, function (error) {
                callback(error);
            });

        async function onSignedInUpdated(resp) {
            if (resp.error !== undefined) {
                throw (resp);
            }

            callback(null);
        }
    }

    function authenticate(callback)
    {
        gapi.load('client',
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
