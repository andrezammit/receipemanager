"use strict";

/* jshint unused: false */

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
	this.date = "";
	this.recipies = [];
}

var RESULT_TYPE_BOOK 	= 1;
var RESULT_TYPE_SECTION = 2;
var RESULT_TYPE_RECIPE	= 3;
var RESULT_TYPE_TAG		= 4;

var KEY_UP 				= 38;
var KEY_DOWN 			= 40;
var KEY_ENTER			= 13;
