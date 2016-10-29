var Google = require('googleapis');

var OAuth = require('./OAuth');

var _googleDrive = Google.drive('v3');
var _googleCalendar = Google.calendar('v3');

var _fileId = null;
var _calendarId = null;

function findDatabase(callback)
{
    _googleDrive.files.list(
        {
            auth: OAuth.getClient(),
            spaces: 'appDataFolder',
            pageSize: 10,
            fields: 'files(id, name, mimeType, appProperties)'
        },
        function (error, response)
        {
            if (error)
            {
                console.log("Google Drive API error: " + error);
                callback(null);

                return;
            }

            var files = response.files;

            for (var i = 0; i < files.length; i++)
            {
                var file = files[i];

                if (file.name !== 'RecipeManager.json')
                    continue;

                console.log("Database found: %s (%s)", file.name, file.id);

                var remoteDbVersion = parseInt(file.appProperties.version);
                var unzip = file.mimeType === 'application/zip';

                if (!unzip && file.mimeType !== 'application/json')
                {
                    console.log("Invalid database file type: %s.", file.mimeType);

                    callback(null);
                    return;
                }

                _fileId = file.id;

                callback(file.id, remoteDbVersion, unzip);
                return;
            }

            console.log("Databsase not found on Google Drive.");
            callback(null);
        });
}

function downloadFile(fileId, callback)
{
    _googleDrive.files.get(
        {
            auth: OAuth.getClient(),
            fileId: fileId,
            alt: 'media'
        },
        function (error, file)
        {
            if (error)
                console.log("Failed to download file. " + error);

            callback(error, file);
        });
}

function updateDatabase(fileData, newDbVersion, callback)
{
    var appProperties =
        {
            version: newDbVersion
        };

    updateFile(_fileId, fileData, appProperties, callback);
}

function updateFile(fileId, fileData, appProperties, callback)
{
    _googleDrive.files.update(
        {
            auth: OAuth.getClient(),
            fileId: fileId,
            resource:
            {
                appProperties: appProperties
            },
            media:
            {
                mimeType: 'application/zip',
                body: fileData
            },
            fields: 'id'
        },
        function (error, file)
        {
            if (error)
                console.log("File update failed. " + error);

            if (callback !== null)
                callback(error, file);
        });
}

function addDatabase(fileData, newDbVersion, callback)
{
    var appProperties =
        {
            version: newDbVersion
        };

    addFile('RecipeManager.json', fileData, appProperties, 
        function(error, file)
        {
            if (error !== null)
                _fileId = file.id;

            callback(error, file);
        });
}

function addFile(fileName, fileData, appProperties, callback)
{
    _googleDrive.files.insert(
        {
            auth: OAuth.getClient(),
            resource:
            {
                name: fileName,
                parents: ['appDataFolder'],
                appProperties: appProperties
            },
            media:
            {
                mimeType: 'application/json',
                body: fileData
            },
            fields: 'id'
        },
        function (error, file)
        {
            if (error)
                console.log("Add file failed. " + error);

            callback(error, file);
        });
}

function initCalendar(callback)
{
    getCalendarId(
        function (error, calendarId)
        {
            if (error)
            {
                callback();
                return;
            }

            if (calendarId === null)
            {
                createNewCalenadar(callback);
                return;
            }

            _calendarId = calendarId;
            console.log('Google Calendar found. ID: ' + _calendarId);

            if (callback !== null)
                callback();
        }
    );
}

function createNewGoogleCalenadar(callback)
{
    var newCalendar =
        {
            summary: "Recipe Manager",
        };

    _googleCalendar.calendars.insert(
        {
            auth: OAuth.getClient(),
            resource: newCalendar
        },
        function (error, response)
        {
            if (error)
            {
                console.log('Failed to add Google Calendar. ' + error);
            }
            else
            {
                console.log('Created new Google Calendar. ID: ' + response.id);
            }

            if (callback !== null)
                callback();
        }
    );
}

function getCalendarId(callback)
{
    _googleCalendar.calendarList.list(
        {
            auth: OAuth.getClient()
        },
        function (error, response)
        {
            if (error)
            {
                console.log('Failed to list Google Calendars. ' + error);

                callback(error, null);
                return;
            }

            var calendars = response.items;
            for (var i = 0; i < calendars.length; i++)
            {
                var calendar = calendars[i];

                if (calendar.summary === "Recipe Manager")
                {
                    callback(null, calendar.id);
                    return;
                }
            }

            console.log('Google calendars not found.');
            callback(null, null);
        });
}

function getCalendarEvents(dateArray, callback)
{
    var dateStart = new Date(parseInt(dateArray[2]), parseInt(dateArray[1]), parseInt(dateArray[0]));

    var dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    _googleCalendar.events.list(
        {
            auth: OAuth.getClient(),
            calendarId: _calendarId,
            timeMin: dateStart.toISOString(),
            timeMax: dateEnd.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        },
        function (error, response)
        {
            if (error)
            {
                console.log('Failed to get Google Calendar events for ' + date + '. ' + error);
                return;
            }

            callback(null, response);
        });
}

function createCalendarEvent(event, callback)
{
    _googleCalendar.events.insert(
        {
            auth: OAuth.getClient(),
            calendarId: _calendarId,
            resource: event
        },
        function (error, response)
        {
            if (error)
                console.log('Failed to add Google Calendar event. ' + error);

            if (callback !== null)
                callback(error);
        }
    );
}

function deleteCalendarEvent(event, callback)
{
    _googleCalendar.events.delete(
        {
            auth: OAuth.getClient(),
            calendarId: _calendarId,
            eventId: event.id
        },
        function (error, response)
        {
            if (error)
                console.log('Failed to delete Google Calendar event. ' + error);

            if (callback !== null)
                callback(error);
        });
}

exports.downloadFile = downloadFile;
exports.addDatabase = addDatabase;
exports.updateDatabase = updateDatabase;
exports.findDatabase = findDatabase;
exports.getCalendarEvents = getCalendarEvents;
exports.createCalendarEvent = createCalendarEvent;
exports.deleteCalendarEvent = deleteCalendarEvent;
exports.authenticate = OAuth.checkAuth;
exports.initCalendar = initCalendar;