/* jshint unused: false */

var path = require('path');

var _db = 
	{ 
		books: [], 
		sections: [],
		recipes: [],
		tags: [],
		calendar: []
	};

function Recipe()
{
	this.id = 0;
	this.sectionId = null;
	this.name = "";
	this.page = "";
	this.isCooked = false;
	this.isInteresting = false;
	this.comment = "";
	this.tagIds = [];
	this.rating = 0;
}

function Book()
{
	this.id = 0;
	this.name = "";
	this.sectionIds = [];
}

function Section()
{
	this.id = 0;
	this.name = "";
	this.recipeIds = [];
	this.tagIds = [];
}

function Tag()
{
	this.id = 0;
	this.name = "";
	this.recipeIds = [];
	this.sectionIds = [];
}

function DateRecipe()
{
	this.id = 0;
	this.name = "";
}

function DateEntry()
{
	this.id = "";
	this.recipes = [];
}

function Settings()
{
	this.isSidebarOpen = true;
}

var RESULT_TYPE_BOOK 		= 1;
var RESULT_TYPE_SECTION 	= 2;
var RESULT_TYPE_RECIPE		= 3;
var RESULT_TYPE_TAG			= 4;
var RESULT_TYPE_DATEENTRY 	= 5;

var KEY_UP 					= 38;
var KEY_DOWN 				= 40;
var KEY_ENTER				= 13;
var KEY_ESC					= 27;

var _baseDir = path.dirname(require.main.filename);

var _tokenDir = _baseDir + '/.credentials/';
var _tokenPath = _tokenDir + 'GoogleAuth.json';

var _localDataDir = _baseDir + '/.data/';
var _localDbPath = _localDataDir + 'RecipeManager.json';

var _dbVersionPath = _localDataDir + 'version';

var _localSettingsPath = _localDataDir + 'localSettings.json';
