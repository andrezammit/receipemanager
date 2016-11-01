/* globals document */

require('app-module-path').addPath(__dirname + '/modules/');

var RecipeManager = require('RecipeManager');

$(document).ready(
    function ()
    {
        RecipeManager.start();
    });