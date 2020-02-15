class Database
{
	constructor()
	{
		this.books = [];
		this.sections = [];
		this.recipes = [];
		this.tags = [];
		this.calendar = [];
	}
}

class Recipe
{
	constructor()
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
}

class Book
{
	constructor()
	{
		this.id = 0;
		this.name = "";
		this.sectionIds = [];
	}
}

class Section
{
	constructor()
	{
		this.id = 0;
		this.bookId = null;
		this.name = "";
		this.recipeIds = [];
		this.tagIds = [];
	}
}

class Tag
{
	constructor()
	{
		this.id = 0;
		this.name = "";
		this.recipeIds = [];
		this.sectionIds = [];
	}
}

class DateRecipe
{
	constructor()
	{
		this.id = 0;
		this.name = "";
	}
}

class DateEntry
{
	constructor()
	{
		this.id = "";
		this.recipes = [];
	}
}

class Settings
{
	constructor()
	{
		this.isSidebarOpen = true;
	}
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

var SITE_UNKNOWN			= 0;
var SITE_YUMMLY				= 1;
var SITE_ACELINE			= 2;
var SITE_BIGOVEN			= 3;
var SITE_GOURMET			= 4;

// var _baseDir = path.dirname(require.main.filename);

// var _tokenDir = _baseDir + '/.credentials/';
// var _tokenPath = _tokenDir + 'GoogleAuth.json';

// var _localDataDir = _baseDir + '/.data/';
// var _localDbPath = _localDataDir + 'RecipeManager.json';

// var _dbVersionPath = _localDataDir + 'version';

// var _localSettingsPath = _localDataDir + 'localSettings.json';

// exports.getTokenDir = 
// 	function()
// 	{
// 		return _tokenDir;
// 	};

// exports.getLocalDataDir = 
// 	function()
// 	{
// 		return _localDataDir;
// 	};

// exports.getLocalSettingsPath = 
// 	function()
// 	{
// 		return _localSettingsPath;
// 	};

// exports.getDbVersionPath = 
// 	function()
// 	{
// 		return _dbVersionPath;
// 	};

// exports.getLocalDbPath = 
// 	function()
// 	{
// 		return _localDbPath;
// 	};

// exports.getTokenPath =
// 	function()
// 	{
// 		return _tokenPath;
// 	};

// exports.Database = Database;
// exports.DateEntry = DateEntry;
// exports.Recipe = Recipe;
// exports.Book = Book; 
// exports.Tag = Tag;
// exports.Section = Section;
// exports.DateRecipe = DateRecipe;

// exports.Settings = Settings;

// exports.KEY_UP = KEY_UP;
// exports.KEY_ESC = KEY_ESC;
// exports.KEY_DOWN = KEY_DOWN;
// exports.KEY_ENTER = KEY_ENTER;

// exports.RESULT_TYPE_BOOK = RESULT_TYPE_BOOK;
// exports.RESULT_TYPE_DATEENTRY = RESULT_TYPE_DATEENTRY;
// exports.RESULT_TYPE_RECIPE = RESULT_TYPE_RECIPE;
// exports.RESULT_TYPE_SECTION = RESULT_TYPE_SECTION;
// exports.RESULT_TYPE_TAG = RESULT_TYPE_TAG;

// exports.SITE_UNKNOWN = SITE_UNKNOWN; 
// exports.SITE_YUMMLY = SITE_YUMMLY;
// exports.SITE_ACELINE = SITE_ACELINE;
// exports.SITE_BIGOVEN = SITE_BIGOVEN;
// exports.SITE_GOURMET = SITE_GOURMET;