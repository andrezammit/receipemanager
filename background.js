/* globals RESULT_TYPE_BOOK */
/* globals RESULT_TYPE_SECTION */
/* globals RESULT_TYPE_RECIPE */
/* globals RESULT_TYPE_TAG */
/* globals RESULT_TYPE_DATEENTRY */

/* globals Recipe */
/* globals Book */
/* globals Section */
/* globals Tag */
/* globals DateEntry */

/* globals _db */
/* globals window */
/* globals FileReader */

// chrome.app.runtime.onLaunched.addListener(
// 	function() 
// 	{
//   		chrome.app.window.create("index.html", 
//   		{
//     		"bounds": 
//     		{
//                 "width": Math.round(window.screen.availWidth * 0.8),
//                 "height": Math.round(window.screen.availHeight * 0.8)
//             }
//   		});
// });

// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) 
//     {
//         switch (request.command)
//         {
//             case "getBunchOfResults":
//             {
//                 sendResponse(getBunchOfResults());
//             }
//             break;

//             case "getAllBooks":
//             {
//                 sendResponse(getAllBooks());
//             }
//             break;

//             case "getBookSections":
//             {
//                 sendResponse(getBookSections(request.id));
//             }
//             break;

//             case "getSectionRecipes":
//             {
//                 sendResponse(getSectionRecipes(request.id));
//             }
//             break;

//             case "loadDatabase":
//             {
//                 loadDatabase(
//                     function()
//                     {
//                         sendResponse();
//                     });

//                 return true;
//             }
//             break;

//             case "saveDatabase":
//             {
//                 saveDatabase(
//                     function()
//                     {
//                         sendResponse();
//                     });

//                 return true;
//             }
//             break;

//             case "importDatabase":
//             {
//                 importDatabase(request.data,
//                     function()
//                     {
//                         sendResponse();
//                     });

//                 return true;
//             }
//             break;

//             case "updateRecipe":
//             {
//                 updateRecipe(request.id, request.recipe);

//                 saveDatabase();
//                 sendResponse();
//             }
//             break;

//             case "updateSection":
//             {
//                 updateSection(request.id, request.section, request.tagIdDiff);
                
//                 saveDatabase();
//                 sendResponse();
//             }
//             break;

//             case "updateTag":
//             {
//                 updateTag(request.id, request.tag);
                
//                 saveDatabase();
//                 sendResponse();
//             }
//             break;

//             case "updateDateEntry":
//             {
//                 updateDateEntry(request.dateEntry);
                
//                 saveDatabase();
//                 sendResponse();
//             }
//             break;

//             case "getObjectById":
//             {
//                 var object = getObjectById(request.id, request.type);
//                 sendResponse(object);
//             }
//             break;

//             case "getNextAvailableId":
//             {
//                 var id = getNextAvailableId(request.type);
//                 sendResponse(id);
//             }
//             break;

//             case "getTagRecipes":
//             {
//                 var recipes = getTagRecipes(request.id, _db);
//                 groupRecipesBySection(recipes, _currResults.recipes);

//                 sendResponse(getBunchOfResults());
//             }
//             break;

//             case "getSearchSuggestions":
//             {
//                 sendResponse(getSearchSuggestions(request.searchText));
//             }
//             break;

//             case "getRecipeSuggestions":
//             {
//                 sendResponse(getRecipeSuggestions(request.searchText));
//             }
//             break;
//         }
//   });


// function filterRecipeSectionTagIds(tagIds, sectionId)
// {
//     var filteredTags = [];
//     var section = getSectionById(sectionId);

//     var size = tagIds.length;
//     for (var cnt = 0; cnt < size; cnt++) 
//     {
//         var tagId = tagIds[cnt];

//         if (section.tagIds.indexOf(tagId) == -1)
//             continue;

//         filteredTags.push(tagId);
//     }

//     return filteredTags;
// }


