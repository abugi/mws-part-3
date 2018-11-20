//TODO: Create new database and database stores
const dbPromise = idb.open('restaurant-review', 1, db => {
    if (!db.objectStoreNames.contains('restaurants')) {
        db.createObjectStore('restaurants', { keyPath: 'id' });
    }
});

//TODO: Write data into IndexedDB
const writeData = (dbStore, restaurants) => {
    return dbPromise
        .then(db => {
            let tx = db.transaction(dbStore, 'readwrite');
            let store = tx.objectStore(dbStore);
            store.put(restaurants);
            return tx.complete;
        });
}

//TODO: Read data from IndexedDB
const readData = (dbStore) => {
    return dbPromise
        .then( db => {
            let tx = db.transaction(dbStore, 'readonly');
            let store = tx.objectStore(dbStore);
            return store.getAll();
        });
}

const db = (() => {
    // indexeddb connection
    const dbPromise = idb.open('restaurants-reviews', 2, upgradeDb => {
        if (!upgradeDb.objectStoreNames.contains("restaurants")) {
            upgradeDb.createObjectStore("restaurants", {
                keyPath: "id"
            });
        }

        if (!upgradeDb.objectStoreNames.contains("reviews")) {
            const reviewsDb = upgradeDb.createObjectStore("reviews", {
                keyPath: "unique"
            });
            reviewsDb.createIndex("restaurant_id", "restaurant_id");
        }

        if (!upgradeDb.objectStoreNames.contains("defered-reviews")) {
            upgradeDb.createObjectStore("defered-reviews", {
                keyPath: "id"
            });
        }

    });
    // fetch a restaurant by ID
    fetchById = id => {
        return dbPromise.then(db => {
            const tx = db.transaction('restaurants');
            const restaurantStore = tx.objectStore('restaurants');

            return restaurantStore.get(parseInt(id));
        })
            .then(restaurant => restaurant)
            .catch(error => console.log('Unable to fetch restaurant', error))
    };
    // store a restaurant object
    storebyId = restaurant => {
        dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');

            store.put(restaurant);
            return tx.complete;
        })
            .then(() => console.log('restaurant added'))
            .catch(error => console.log('unable to store restaurant', error));
    };
    // add reviews by restaurant is
    addReviewByRestaurantId = reviews => {
        dbPromise.then(db => {
            const tx = db.transaction("reviews", "readwrite");
            const store = tx.objectStore("reviews");

            for (review of reviews) {
                store.put(review);
            }
            return tx.complete;
        })
            .then(() => console.log('reviews saved to IDB'))
            .catch(error => console.log('Unable to save reviews to IDB', error));
    }
    // add single review
    addSingleReview = review => {
        dbPromise.then(db => {
            const tx = db.transaction("reviews", "readwrite");
            const store = tx.objectStore("reviews");

            store.put(review);
            return tx.complete;
        })
            .then(() => console.log('review saved to IDB'))
            .catch(error => console.log('Unable to save review to IDB', error));
    }
    // get all reviews by restaurant id
    getReviewByRestaurantId = restaurantId => {
        return dbPromise.then(db => {
            const tx = db.transaction("reviews");
            let store = tx.objectStore("reviews");
            store = store.index("restaurant_id")

            return store.getAll(parseInt(restaurantId));
        })
            .then(reviews => reviews)
            .catch(error => console.log('unable to fetch reviews from idb', error));
    }
    // save defred reviews
    writeDeferedReviewToIDB = (data) => {
        return dbPromise
            .then(db => {
                const tx = db.transaction("defered-reviews", 'readwrite');
                const store = tx.objectStore("defered-reviews");
                store.put(data);
                return tx.complete;
            });
    }
    // read all deererd reviews
    readeAllDeferedReviews = () => {
        return dbPromise
            .then(db => {
                const tx = db.transaction("defered-reviews", "readonly");
                const store = tx.objectStore("defered-reviews");

                return store.getAll();
            });
    }
    // delete defered reviews
    deleteDeferedReview = id => {
        return dbPromise
            .then(db => {
                const tx = db.transaction("defered-reviews", "readwrite");
                const store = tx.objectStore("defered-reviews");
                store.delete(id);
                return tx.complete;
            })
            .then(() => console.log('defered review deleted'));
    }

    return {
        storebyId: (storebyId),
        fetchById: (fetchById),
        addReviewByRestaurantId: (addReviewByRestaurantId),
        addSingleReview: (addSingleReview),
        getReviewByRestaurantId: (getReviewByRestaurantId),
        writeDeferedReviewToIDB: (writeDeferedReviewToIDB),
        readeAllDeferedReviews: (readeAllDeferedReviews),
        deleteDeferedReview: (deleteDeferedReview)
    }
})();