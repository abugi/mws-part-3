// check if current browser support service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => {
      console.log('service worker registered successfully');
    })
    .catch(err => {
      console.log(`service worker registration failed with ${err}`)
    })
} else {
  console.log('Serviceworker not supported by this version of the browser!');
}

/**
 * Common database helper functions.
 */
class DBHelper {
  // Database URL.
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  // Fetch all restaurants.
  static fetchRestaurants(callback) {
    let dataReceived = false;

    fetch(DBHelper.DATABASE_URL)
      .then(response => {
        return response.json();
      })
      .then(restaurants => {
        dataReceived = true;
        callback(null, restaurants);
      });

    //TODO: Get dynamic data from indexedDB
    if ('indexedDB' in window) {
      readData('restaurants')
        .then(restaurants => {
          if (!dataReceived) {
            callback(null, restaurants);
          }
        });
    }
  }

  // Fetch a restaurant by its ID.
  static fetchRestaurantById(id, callback) {
    // check if restaurant exist inside our indexedDB
    db.fetchById(id)
      .then(restaurant => {
        if (restaurant) {
          callback(null, restaurant);
        } else {
          // fetch restaurant from the database
          fetch(`${DBHelper.DATABASE_URL}/${id}`)
            .then(res => res.json())
            .then(restaurant => {
              callback(null, restaurant);
              db.storebyId(restaurant);
            })
            .catch(error => console.log(error));
        }
      })
      .catch(error => console.log(error));
  }

  // Fetch restaurants by a cuisine type with proper error handling.
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  // Fetch restaurants by a neighborhood with proper error handling.
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  // Fetch restaurants by a cuisine and a neighborhood with proper error handling.
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  // Fetch all neighborhoods with proper error handling.
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  // Fetch all cuisines with proper error handling.
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  // Restaurant page URL.
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  // Restaurant image URL.
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.id}.jpg`;
  }

  /**
   * get restaurant reviews
   * render them and
   * save them to IDB
   */
  static fetchReviewsById(id, callback) {
    db.getReviewByRestaurantId(id)
      .then(reviews => {
        if (reviews.length > 0) {
          // got reviews from IDB
          console.log("got reviews from IDB");
          callback(null, reviews);
        } else {
          // no reviews in IDB
          const url = `http://localhost:1337/reviews/?restaurant_id=${id}`;
          // get  reviews online to render and save them to IDB
          fetch(url)
            .then(res => res.json())
            .then(reviews => {
              reviews = reviews.map(review => {
                const unique =
                  "_" +
                  Math.random()
                    .toString(36)
                    .substr(2, 9);
                return {
                  id: review.id,
                  restaurant_id: review.restaurant_id,
                  unique: unique,
                  name: review.name,
                  rating: review.rating,
                  comments: review.comments,
                  createdAt: review.createdAt,
                  updatedAt: review.updatedAt
                };
              });
              db.addReviewByRestaurantId(reviews);
              callback(null, reviews);
            })
            .catch(error => callback(error, null));
        }
      })
      .catch(error => callback(error, null));
  }

  /**
   * save review data to the database
   */
  static sendReviewData(review, callback) {
    // we are online or lie-fi
    const url = "http://localhost:1337/reviews/";

    fetch(url, {
      method: "POST",
      header: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(review)
    })
      .then(res => res.json())
      .then(review => callback(null, review))
      .catch(error => {
        // network failure
        callback(error, null);
      });
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
}

