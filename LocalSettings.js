var fs = require('fs');
var path = require('path');

var _settings = new Settings();

function load(callback)
{
    fs.readFile(_localSettingsPath,
        function (error, jsonSettings)
        {
            if (error !== null)
            {
                callback(error);
                return;
            }

            _settings = JSON.parse(jsonSettings);
            callback(error);
        });
}

function save(callback)
{
    var jsonSettings = JSON.stringify(_settings);

    fs.writeFile(_localSettingsPath, jsonSettings,
        function (error)
        {
            callback(error);
        });
}

function isSidebarOpen()
{
    return _settings.isSidebarOpen;
}

function setSidebarOpen(isOpen)
{
    _settings.isSidebarOpen = isOpen;
}

exports.load = load;
exports.save = save;
exports.setSidebarOpen = setSidebarOpen;
exports.isSidebarOpen = isSidebarOpen;