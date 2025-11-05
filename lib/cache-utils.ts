/**
 * Utility functions for safely working with the Cache API
 */

// Check if the Cache API is available
export const isCacheAvailable = () => {
  return typeof caches !== "undefined"
}

// Safely open a cache
export const safeOpenCache = async (cacheName: string) => {
  if (!isCacheAvailable()) {
    console.warn("Cache API is not available in this environment")
    return null
  }

  try {
    return await caches.open(cacheName)
  } catch (error) {
    console.error("Failed to open cache:", error)
    return null
  }
}

// Safely put an item in the cache
export const safePutInCache = async (cacheName: string, request: Request, response: Response) => {
  const cache = await safeOpenCache(cacheName)
  if (!cache) return false

  try {
    await cache.put(request, response)
    return true
  } catch (error) {
    console.error("Failed to put item in cache:", error)
    return false
  }
}

// Safely get an item from the cache
export const safeGetFromCache = async (cacheName: string, request: Request) => {
  const cache = await safeOpenCache(cacheName)
  if (!cache) return null

  try {
    return await cache.match(request)
  } catch (error) {
    console.error("Failed to get item from cache:", error)
    return null
  }
}

// Safely delete an item from the cache
export const safeDeleteFromCache = async (cacheName: string, request: Request) => {
  const cache = await safeOpenCache(cacheName)
  if (!cache) return false

  try {
    await cache.delete(request)
    return true
  } catch (error) {
    console.error("Failed to delete item from cache:", error)
    return false
  }
}
