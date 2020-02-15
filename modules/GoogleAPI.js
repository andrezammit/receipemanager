const GoogleAPI = (function () {
    var _fileId = null;
    var _calendarId = null;

    function findDatabase(callback) {
        gapi.client.drive.files.list(
            {
                spaces: 'appDataFolder',
                pageSize: 10,
                fields: 'files(id, name, mimeType, appProperties)'
            }).then(onFileList, onFileListError);

        function onFileListError(error) {
            if (error) {
                console.log("Google Drive API error: " + error);
            }

            callback(error);
        }

        function onFileList(response) {
            var files = response.result.files;

            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                if (file.name !== 'RecipeManager.json')
                    continue;

                console.log("Database found: %s (%s)", file.name, file.id);

                var remoteDbVersion = parseInt(file.appProperties.version);
                var unzip = file.mimeType === 'application/zip';

                if (!unzip && file.mimeType !== 'application/json') {
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
        }
    }

    function downloadFile(fileId, callback) {
        gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        }).then(onFileDownloaded, onFileDownloadFailed);

        function onFileDownloaded(file) {
            callback(null, file);
        }

        function onFileDownloadFailed(error) {
            console.log("Failed to download file. " + error);
            callback(error, file);
        }
    }

    function updateDatabase(fileData, newDbVersion, callback) {
        var appProperties = {
            version: newDbVersion
        };

        updateFile(_fileId, fileData, appProperties, callback);
    }

    function updateFile(fileId, fileData, appProperties, callback) {
        gapi.client.drive.files.update({
            fileId: fileId,
            appProperties: appProperties,
            fields: 'id',
        }).then(onMetadataUpdated, onFileError);
        
        function onMetadataUpdated(response) {
            let file = new Blob([fileData]); 

            fetch(`https://www.googleapis.com/upload/drive/v3/files/${response.result.id}`, {
                method: 'PATCH',
                headers: new Headers({
                    'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
                    'Content-Type': 'application/zip'
                }),
                body: file
            }).then(
                function () {
                    onFileUpdated(response)
                },
                onFileError);
        }

        function onFileUpdated(response) {
            let fileId = response.result.id;
            callback(null, fileId);
        }

        function onFileError(error) {
            console.log("File update failed. " + error);
            callback(error);
        }
    }

    function addDatabase(fileData, newDbVersion, callback) {
        var appProperties = {
            version: newDbVersion
        };

        addFile('RecipeManager.json', fileData, appProperties,
            function (error, file) {
                if (error !== null)
                    _fileId = file.id;

                callback(error, file);
            });
    }

    function addFile(fileName, fileData, appProperties, callback) {
        gapi.client.drive.files.create({
            resource: {
                name: fileName,
                parents: ['appDataFolder'],
                appProperties: appProperties
            },
            media: {
                mimeType: 'application/json',
                body: fileData
            },
            fields: 'id'
        }).then(onFileAdded, onFileError);

        function onFileAdded(response) {
            var file = response.body.file;
            callback(null, file);
        }

        function onFileError(error) {
            console.log("Add file failed. " + error);
            callback(error);
        }
    }

    function initCalendar(callback) {
        getCalendarId(
            function (error, calendarId) {
                if (error) {
                    callback();
                    return;
                }

                if (calendarId === null) {
                    createNewCalendar(callback);
                    return;
                }

                _calendarId = calendarId;
                console.log('Google Calendar found. ID: ' + _calendarId);

                if (callback !== null)
                    callback();
            }
        );
    }

    function createNewCalendar(callback) {
        let newCalendar = {
            summary: "Recipe Manager",
        };

        gapi.client.calendar.calendars.insert(
            {
                resource: newCalendar
            }).then(onCalendarCreated, onCalendarError);

        function onCalendarCreated(response) {
            _calendarId = response.result.id;
            console.log('Created new Google Calendar. ID: ' + _calendarId);

            callback();
        }

        function onCalendarError(error) {
            console.log('Failed to add Google Calendar. ' + error);
            callback(error);
        }
    }

    function getCalendarId(callback) {
        gapi.client.calendar.calendarList.list().then(
            onCalendarList,
            onCalenderListError);

        function onCalendarList(response) {
            let calendars = response.result.items;

            for (let i = 0; i < calendars.length; i++) {
                let calendar = calendars[i];

                if (calendar.summary === "Recipe Manager" && 
                    calendar.accessRole === "owner") {
                    callback(null, calendar.id);
                    return;
                }
            }

            console.log('Google calendar not found.');
            callback(null, null);
        }

        function onCalenderListError(error) {
            console.log('Failed to list Google Calendars. ' + error);
            callback(error, null);
        }
    }

    function getCalendarEvents(dateArray, callback) {
        var dateStart = new Date(parseInt(dateArray[2]), parseInt(dateArray[1]), parseInt(dateArray[0]));

        var dateEnd = new Date(dateStart);
        dateEnd.setDate(dateEnd.getDate() + 1);

        gapi.client.calendar.events.list({
            calendarId: _calendarId,
            timeMin: dateStart.toISOString(),
            timeMax: dateEnd.toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        }).then(onCalendarEvents, onCalendarEventsError);

        function onCalendarEvents(response) {
            callback(null, response.result);
        }

        function onCalendarEventsError(error) {
            console.log('Failed to get Google Calendar events for ' + dateStart + '. ' + error);
            callback(error);
        }
    }

    function createCalendarEvent(event, callback) {
        gapi.client.calendar.events.insert({
            calendarId: _calendarId,
            resource: event
        }).then(onCalendarEventCreated, onCalendarEventError);

        function onCalendarEventCreated() {
            callback(null);
        }

        function onCalendarEventError(error) {
            console.log('Failed to add Google Calendar event. ' + error);
            callback(error);
        }
    }

    function deleteCalendarEvent(event, callback) {
        gapi.client.calendar.events.delete(
            {
                calendarId: _calendarId,
                eventId: event.id
            }).then(onCalendarEventDeleted, onCalendarEventError);

        function onCalendarEventDeleted() {
            callback(null);
        }

        function onCalendarEventError(error) {
            console.log('Failed to delete Google Calendar event. ' + error);
            callback(error);
        }
    }

    return {
        findDatabase: function (callback) {
            findDatabase(callback);
        },

        downloadFile: function (fileId, callback) {
            downloadFile(fileId, callback);
        },

        initCalendar: function (callback) {
            initCalendar(callback);
        },

        addDatabase: function (fileData, newDbVersion, callback) {
            addDatabase(fileData, newDbVersion, callback);
        },

        updateDatabase: function (fileData, newDbVersion, callback) {
            updateDatabase(fileData, newDbVersion, callback);
        },

        getCalendarEvents: function (dateArray, callback) {
            getCalendarEvents(dateArray, callback);
        },

        createCalendarEvent: function (event, callback) {
            createCalendarEvent(event, callback);
        },

        deleteCalendarEvent: function (event, callback) {
            deleteCalendarEvent(event, callback);
        }
    }
})();
