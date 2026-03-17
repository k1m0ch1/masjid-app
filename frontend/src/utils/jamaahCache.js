/**
 * Jamaah list cache with 10-minute expiration
 * Automatically invalidated on create/update/delete operations
 */

const CACHE_KEY = 'masjid_jamaah_cache'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes in milliseconds

/**
 * Get cached jamaah list if still valid
 * @returns {Array|null} Cached data or null if expired/not found
 */
export function getCachedJamaah() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()

    // Check if expired (older than 10 minutes)
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    return data
  } catch (err) {
    console.error('Failed to read jamaah cache:', err)
    return null
  }
}

/**
 * Store jamaah list to cache with current timestamp
 * @param {Array} data - Jamaah list to cache
 */
export function setCachedJamaah(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (err) {
    console.error('Failed to cache jamaah:', err)
    // If localStorage is full, clear cache and try again
    if (err.name === 'QuotaExceededError') {
      localStorage.removeItem(CACHE_KEY)
    }
  }
}

/**
 * Invalidate jamaah cache (call this on create/update/delete)
 */
export function invalidateJamaahCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (err) {
    console.error('Failed to invalidate jamaah cache:', err)
  }
}

/**
 * Check if cache exists and is still valid
 * @returns {boolean}
 */
export function hasCachedJamaah() {
  return getCachedJamaah() !== null
}
