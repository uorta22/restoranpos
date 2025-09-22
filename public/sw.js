// Service Worker with robust error handling for cache operations

const CACHE_NAME = "restaurant-pos-cache-v1"
const OFFLINE_URL = "/offline.html"

// Helper function to safely cache resources
async function safeCacheResources(resources) {
  try {
    const cache = await caches.open(CACHE_NAME).catch((err) => {
      console.error("Failed to open cache:", err)
      return null
    })

    if (!cache) return

    const cachePromises = resources.map((resource) => {
      return cache
        .put(
          resource,
          fetch(resource).then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to fetch ${resource}: ${response.status}`)
            }
            return response
          }),
        )
        .catch((err) => {
          console.error(`Failed to cache ${resource}:`, err)
          // Continue with other resources even if one fails
          return Promise.resolve()
        })
    })

    await Promise.allSettled(cachePromises)
  } catch (error) {
    console.error("Error during cache operation:", error)
  }
}

// Install event handler with error handling
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Create a fallback offline page if it doesn't exist
        const cache = await caches.open(CACHE_NAME).catch((err) => {
          console.error("Failed to open cache during install:", err)
          return null
        })

        if (cache) {
          try {
            await cache.add(OFFLINE_URL)
            console.log("Offline page cached successfully")
          } catch (error) {
            console.error("Failed to cache offline page:", error)
          }
        }
      } catch (error) {
        console.error("Service worker installation failed:", error)
      }
    })(),
  )
})

// Activate event handler with error handling
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys().catch((err) => {
          console.error("Failed to get cache keys:", err)
          return []
        })

        const cacheDeletePromises = cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            return caches.delete(name).catch((err) => {
              console.error(`Failed to delete old cache ${name}:`, err)
              return Promise.resolve()
            })
          })

        await Promise.allSettled(cacheDeletePromises)
      } catch (error) {
        console.error("Service worker activation failed:", error)
      }
    })(),
  )
})

// Fetch event handler with error handling and fallbacks
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return

  event.respondWith(
    (async () => {
      try {
        // Try to get from network first
        const networkResponse = await fetch(event.request).catch((err) => {
          console.log("Fetch from network failed, falling back to cache:", err)
          return null
        })

        if (networkResponse && networkResponse.ok) {
          // Try to update the cache with the fresh response
          try {
            const cache = await caches.open(CACHE_NAME)
            // Clone the response since it can only be used once
            cache.put(event.request, networkResponse.clone()).catch((err) => {
              console.warn("Failed to update cache, but network response is still valid:", err)
            })
          } catch (cacheError) {
            console.warn("Cache operation failed, but network response is still valid:", cacheError)
          }

          return networkResponse
        }

        // If network fails, try the cache
        const cachedResponse = await caches.match(event.request).catch((err) => {
          console.error("Cache match failed:", err)
          return null
        })

        if (cachedResponse) {
          return cachedResponse
        }

        // If both network and cache fail, return the offline page for navigation requests
        if (event.request.mode === "navigate") {
          const offlineResponse = await caches.match(OFFLINE_URL).catch((err) => {
            console.error("Failed to get offline page from cache:", err)
            return null
          })

          if (offlineResponse) {
            return offlineResponse
          }
        }

        // If all else fails, return a simple error response
        return new Response("Network and cache both failed. Please try again later.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({
            "Content-Type": "text/plain",
          }),
        })
      } catch (error) {
        console.error("Error in fetch handler:", error)
        return new Response("An unexpected error occurred. Please try again later.", {
          status: 500,
          statusText: "Internal Server Error",
          headers: new Headers({
            "Content-Type": "text/plain",
          }),
        })
      }
    })(),
  )
})
