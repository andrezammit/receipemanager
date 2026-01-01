const OAuth = (function ()
{
    // const _clientId = "13277472194-1hhadv632f58o9gc5qemlldtju2b4bmr.apps.googleusercontent.com";
    const _clientId = "13277472194-hs9hse9r1oc5tkr65si7uma916r1nenu.apps.googleusercontent.com";

    const _scopes = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar";
    
    const _discoveryDocs = [
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", 
        "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
    ];

    function initClient(callback)
    {
        const authObj = {
            discoveryDocs: _discoveryDocs
        };

        gapi.client.init(authObj).then(
            googleSignIn, 
            onGoogleSignInError);

        function googleSignIn() {
            const tokenClient = google.accounts.oauth2.initTokenClient({
                scope: _scopes,
                client_id: _clientId,
                callback: onSignedInUpdated
            });

            try {
                const storedAccessToken = getValidAccessToken();

                if (storedAccessToken) {
                    gapi.client.setToken({
                        access_token: storedAccessToken
                    });

                    callback(null);
                    return;
                }
            } catch (exception) {
                // fall through
            }

            tokenClient.requestAccessToken({ prompt: '' });
        }

        function onGoogleSignInError(error) {
            callback(error);
        }

        async function onSignedInUpdated(authResponse) {
            if (authResponse.error !== undefined) {
                throw (authResponse);
            }

            // resp contains access_token and expires_in (seconds)
            try {
                if (authResponse.access_token) {
                    saveAccessToken(authResponse);

                    gapi.client.setToken({ 
                        access_token: authResponse.access_token 
                    });
                }
            } catch (exception) {
                console.error('Error storing access token: ', exception);
            }

            callback(null);
        }
    }

    function getValidAccessToken()
    {
        const storedToken = JSON.parse(localStorage.getItem('gm_oauth_token') || 'null');
                
        if (storedToken && storedToken.access_token && storedToken.expires_at && Date.now() < storedToken.expires_at) {
            return storedToken.access_token;
        }

        return null;
    }

    function saveAccessToken(authResponse)
    {
        const expiresIn = authResponse.expires_in || 0;
        const expiresAt = Date.now() + (expiresIn * 1000);
        
        const storedAccessToken = {
            access_token: authResponse.access_token,
            expires_at: expiresAt
        };

        localStorage.setItem('gm_oauth_token', JSON.stringify(storedAccessToken));
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
