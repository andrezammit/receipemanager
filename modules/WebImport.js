var request = require('request');

var Engine = require('./Engine');
var Defines = require('./Defines');
var RecipeManager = require('./RecipeManager');

function detectSite(url)
{
    if (url.indexOf("yummly.co") !== -1)
        return SITE_YUMMLY;

    if (url.indexOf("acelineentertainment.com") !== -1)
        return SITE_ACELINE;

    if (url.indexOf("bigoven.com") !== -1)
        return SITE_BIGOVEN;

    if (url.indexOf("maltatoday.com.mt") !== -1)
        return SITE_GOURMET;

    return SITE_UNKNOWN;
}

function getSiteName(site)
{
    switch (site)
    {
        case SITE_YUMMLY:
            return "Yummly";

        case SITE_ACELINE:
            return "Aceline Entertainment";

        case SITE_BIGOVEN:
            return "BigOven";

        case SITE_GOURMET:
            return "Gourmet";
    }

    return "";
}

function yummlyImport(html, recipe)
{
    var primaryInfo = html.find(".primary-info");

    if (primaryInfo.length === 0)
        return false;

    var recipeName = primaryInfo.first().find("h1").text();

    if (recipeName === "")
        return false;

    recipe.name = recipeName;
}

function acelineImport(html, recipe)
{
    var entryTitle = html.find(".entry-title");

    if (entryTitle.length === 0)
        return false;

    var recipeName = entryTitle.get(0).childNodes[0].nodeValue.trim();

    if (recipeName === "")
        return false;

    recipe.name = recipeName;
}

function bigOvenImport(html, recipe)
{
    var title = html.find(".fn");

    if (title.length === 0)
        return false;

    var recipeName = title.first().text().trim();

    if (recipeName === "")
        return false;

    recipe.name = recipeName;
}

function gourmetImport(html, recipe)
{
    var title = html.find(".article_module");

    if (title.length === 0)
        return false;

    var recipeName = title.first().find("h1").text().trim();

    if (recipeName === "")
        return false;

    recipe.name = recipeName;
}

function webImport(url, callback)
{
    var site = detectSite(url);

    if (site === SITE_UNKNOWN)
    {
        console.log("Cannot import URL: " + url);

        callback();
        return;
    }

    var book = Engine.getObjectByName("Web Imports", RESULT_TYPE_BOOK);

    if (book === null) 
    {
        book = new Book();
        book.id = Engine.getNextAvailableId(RESULT_TYPE_BOOK);
        book.name = "Web Imports";

        Engine.updateBook(book.id, book);
    }

    var siteName = getSiteName(site);
    var section = Engine.getObjectByName(siteName, RESULT_TYPE_SECTION);

    if (section === null) 
    {
        section = new Section();
        section.id = Engine.getNextAvailableId(RESULT_TYPE_SECTION);
        section.name = siteName;
        section.bookId = book.id;

        Engine.updateSection(section.id, section);
    }

    request(url,
        function (error, response, html)
        {
            if (error !== null)
            {
                callback(error);
                return;
            }

            html = $(html);

            var recipe = new Recipe();

            recipe.id = Engine.getNextAvailableId(RESULT_TYPE_RECIPE);

            recipe.sectionId = section.id;
            recipe.tagIds = section.tagIds;

            switch (site)
            {
                case SITE_YUMMLY:
                    yummlyImport(html, recipe);
                    break;

                case SITE_ACELINE:
                    acelineImport(html, recipe);
                    break;

                case SITE_BIGOVEN:
                    bigOvenImport(html, recipe);
                    break;

                case SITE_GOURMET:
                    gourmetImport(html, recipe);
                    break;
            }

            if (recipe.comment !== "")
                recipe.comment += "\r\n\r\n";

            recipe.comment += url;

            RecipeManager.showRecipe(recipe.id, recipe.sectionId, recipe);
            callback();
        });
}

exports.import = webImport;