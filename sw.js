const cacheName = "recipeManagerCache";

const urlsToCache = [
    "sw.js",
    "manifest.json",
    "index.html",
    "favicon.ico",
    "styles/loader.css",
    "styles/style.css",
    "modules/Calendar.js",
    "modules/Defines.js",
    "modules/Engine.js",
    "modules/GoogleAPI.js",
    "modules/Launcher.js",
    "modules/OAuth.js",
    "modules/RecipeManager.js",
    "images/close.png",
    "images/delete.png",
    "images/food_1.jpg",
    "images/food_2.jpg",
    "images/food_3.jpg",
    "images/food_4.jpg",
    "images/food_pattern.jpg",
    "images/pattern.jpg",
    "images/pencil.png",
    "images/star_full.png",
    "images/star.png",
    "scripts/jquery-3.4.1.min.js",
    "scripts/jquery-ui.min.js",
    "scripts/jquery.quickfit.js",
    "https://apis.google.com/js/api.js",
    "https://cdn.jsdelivr.net/pako/1.0.3/pako.min.js",
    "https://fonts.googleapis.com/css?family=Trocchi|Ubuntu"
];

console.log("Loading service worker...");

self.addEventListener("install", function (event) {
    console.log("Installing service worker...");
    event.waitUntil(
        caches.open(cacheName)
            .then(function (cache) {
                console.log("Opened service worker cache.");

                let x = cache.addAll(urlsToCache);
                console.log("Service worker cache filled.");

                return x;
            })
    );
});

self.addEventListener("fetch", function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                }
            )
    );
});