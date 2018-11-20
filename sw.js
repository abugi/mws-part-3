importScripts("/js/idb.js");
importScripts("/js/indexDB.js");
importScripts("/js/dbhelper.js");
const static = 'restaurant-7';
const dynamic = 'restReviewDynamic-v1';
const appShell = [
  '/',
  'index.html',
  'restaurant.html',
  '/manifest.json',
  'css/styles.css',
  'js/idb.js',
  'js/indexDB.js',
  'js/dbhelper.js',
  'js/restaurant_info.js',
  'js/main.js',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg',
  'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(static).then(cache => {
      return cache.addAll(appShell);
    })
  );
});

//Call the service worker activate event
self.addEventListener('activate', event => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== static) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

/*
 * checks for a request in cache, return response if found
 * or save it for later use
 */
self.addEventListener('fetch', event => {
  let url = 'http://localhost:1337/restaurants';
  if (event.request.url === url) {
    event.respondWith(fetch(event.request)
      .then(res => {
        const clonedRes = res.clone();
        clonedRes.json()
          .then(restaurants => {
            restaurants.map(restaurants => {
              writeData('restaurants', restaurants)
            })
          });
        return res;
      })
    );
  }else{
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(response => {
        if(response){
          return response;
        }else{
          fetch(event.request)
            .then(res => {
              return caches.open(dynamic)
                .then(cache => {
                  cache.put(event.request.url, res.clone());
                  return res;
                })
            })
        }
    })
  );
  }
});

self.addEventListener('sync', e => {
  console.log("service worker background syncing", e);
  if(e.tag === "sync-new-reviews") {
    console.log("syncing new reviews");
    e.waitUntil(
      db.readeAllDeferedReviews()
        .then(data => {
          for (const review of data) {
            fetch("http://localhost:1337/reviews/", {
              method: "POST",
              header: {
                "Content-Type": "application/json",
                Accept: "application/json"
              },
              body: JSON.stringify({
                restaurant_id: review.restaurant_id,
                name: review.name,
                rating: review.rating,
                comments: review.comments
              })
            })
            .then(res => res.json())
            .then(() => {
              // delete defered review from IDB
              db.deleteDeferedReview(review.id);
            })
            .catch(error => console.log('error syncing data to online server', error));
          }
        })
        .catch(error => console.log('unable to fetch defered reviews from IDB', error))
    )
  }
})
