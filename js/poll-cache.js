// Poll Cache Manager Implementation
// Handles caching of poll configurations and responses for performance

/**
 * PollCache manages caching of poll configurations, responses, and related data
 * Provides intelligent cache management with TTL, size limits, and persistence
 */
class PollCache {
    /**
     * Create a new PollCache instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            maxSize: options.maxSize || window.VidPollConfig?.POLL_CONFIG?.MAX_CACHE_SIZE || 50,
            defaultTTL: options.defaultTTL || window.VidPollConfig?.POLL_CONFIG?.CACHE_DURATION || 300000, // 5 minutes
            storageKey: options.storageKey || window.VidPollConfig?.SESSION_CONFIG?.STORAGE_KEYS?.POLL_CACHE || 'pollCache',
            persistToStorage: options.persistToStorage !== false,
            debugMode: options.debugMode || false,
            useCompression: options.useCompression || false,
            autoCleanup: options.autoCleanup !== false,
            cleanupInterval: options.cleanupInterval || 60000 // 1 minute
        };

        // Cache storage
        this.cache = new Map();
        this.accessTimes = new Map();
        this.hitCounts = new Map();

        // Statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            cleanups: 0
        };

        // Cleanup timer
        this.cleanupTimer = null;

        // Initialize cache
        this._initialize();

        if (this.options.debugMode) {
            console.log('PollCache initialized with options:', this.options);
        }
    }

    /**
     * Initialize cache from storage and start cleanup timer
     * @private
     */
    _initialize() {
        // Load from storage if available
        if (this.options.persistToStorage) {
            this._loadFromStorage();
        }

        // Start automatic cleanup
        if (this.options.autoCleanup) {
            this._startCleanupTimer();
        }
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {*} Cached data or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            if (this.options.debugMode) {
                console.log(`Cache miss: ${key}`);
            }
            return null;
        }

        // Check TTL
        if (this._isExpired(entry)) {
            this.delete(key);
            this.stats.misses++;
            if (this.options.debugMode) {
                console.log(`Cache expired: ${key}`);
            }
            return null;
        }

        // Update access tracking
        this.accessTimes.set(key, Date.now());
        this.hitCounts.set(key, (this.hitCounts.get(key) || 0) + 1);
        this.stats.hits++;

        if (this.options.debugMode) {
            console.log(`Cache hit: ${key}`);
        }

        return entry.data;
    }

    /**
     * Set cached data
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds (optional)
     * @returns {boolean} True if successfully cached
     */
    set(key, data, ttl = null) {
        try {
            const entry = {
                data: data,
                timestamp: Date.now(),
                ttl: ttl || this.options.defaultTTL,
                size: this._calculateSize(data)
            };

            // Check if we need to evict entries
            if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
                this._evictOldest();
            }

            // Store entry
            this.cache.set(key, entry);
            this.accessTimes.set(key, Date.now());
            this.hitCounts.set(key, 0);
            this.stats.sets++;

            if (this.options.debugMode) {
                console.log(`Cache set: ${key} (size: ${entry.size}, ttl: ${entry.ttl}ms)`);
            }

            // Persist to storage if enabled
            if (this.options.persistToStorage) {
                this._saveToStorage();
            }

            return true;

        } catch (error) {
            console.error('Failed to cache data:', error);
            return false;
        }
    }

    /**
     * Delete cached data
     * @param {string} key - Cache key
     * @returns {boolean} True if entry was deleted
     */
    delete(key) {
        const existed = this.cache.has(key);

        if (existed) {
            this.cache.delete(key);
            this.accessTimes.delete(key);
            this.hitCounts.delete(key);
            this.stats.deletes++;

            if (this.options.debugMode) {
                console.log(`Cache deleted: ${key}`);
            }

            // Update storage
            if (this.options.persistToStorage) {
                this._saveToStorage();
            }
        }

        return existed;
    }

    /**
     * Check if key exists in cache (without updating access time)
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists and is not expired
     */
    has(key) {
        const entry = this.cache.get(key);
        return entry && !this._isExpired(entry);
    }

    /**
     * Clear all cached data
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.accessTimes.clear();
        this.hitCounts.clear();

        if (this.options.debugMode) {
            console.log(`Cache cleared: ${size} entries removed`);
        }

        // Update storage
        if (this.options.persistToStorage) {
            this._saveToStorage();
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

        return {
            ...this.stats,
            totalRequests,
            hitRate: Math.round(hitRate * 100) / 100,
            size: this.cache.size,
            maxSize: this.options.maxSize,
            memoryUsage: this._calculateTotalSize()
        };
    }

    /**
     * Get all cache keys
     * @returns {Array<string>} Array of cache keys
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache entries with metadata
     * @returns {Array<Object>} Array of cache entry metadata
     */
    entries() {
        return Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            size: entry.size,
            timestamp: entry.timestamp,
            ttl: entry.ttl,
            expiresAt: entry.timestamp + entry.ttl,
            isExpired: this._isExpired(entry),
            accessCount: this.hitCounts.get(key) || 0,
            lastAccess: this.accessTimes.get(key)
        }));
    }

    /**
     * Cleanup expired entries
     * @returns {number} Number of entries cleaned up
     */
    cleanup() {
        let cleaned = 0;

        for (const [key, entry] of this.cache) {
            if (this._isExpired(entry)) {
                this.delete(key);
                cleaned++;
            }
        }

        this.stats.cleanups++;

        if (this.options.debugMode && cleaned > 0) {
            console.log(`Cache cleanup: ${cleaned} expired entries removed`);
        }

        return cleaned;
    }

    /**
     * Set cache configuration
     * @param {Object} newOptions - New configuration options
     */
    configure(newOptions) {
        this.options = { ...this.options, ...newOptions };

        // Restart cleanup timer if interval changed
        if (newOptions.cleanupInterval && this.options.autoCleanup) {
            this._stopCleanupTimer();
            this._startCleanupTimer();
        }

        // Enforce new size limit
        if (newOptions.maxSize && this.cache.size > newOptions.maxSize) {
            this._enforceMaxSize();
        }

        if (this.options.debugMode) {
            console.log('Cache reconfigured:', this.options);
        }
    }

    /**
     * Get/set cache data with automatic miss handling
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Function to call on cache miss
     * @param {number} ttl - Optional TTL override
     * @returns {Promise<*>} Cached or fetched data
     */
    async getOrFetch(key, fetchFunction, ttl = null) {
        // Try cache first
        let data = this.get(key);

        if (data !== null) {
            return data;
        }

        // Cache miss - fetch data
        try {
            data = await fetchFunction();

            if (data !== null && data !== undefined) {
                this.set(key, data, ttl);
            }

            return data;

        } catch (error) {
            console.error(`Failed to fetch data for cache key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Preload data into cache
     * @param {Array<Object>} entries - Array of {key, data, ttl} objects
     * @returns {number} Number of entries successfully cached
     */
    preload(entries) {
        let loaded = 0;

        entries.forEach(entry => {
            if (entry.key && entry.data !== undefined) {
                if (this.set(entry.key, entry.data, entry.ttl)) {
                    loaded++;
                }
            }
        });

        if (this.options.debugMode) {
            console.log(`Cache preloaded: ${loaded}/${entries.length} entries`);
        }

        return loaded;
    }

    /**
     * Check if entry is expired
     * @param {Object} entry - Cache entry
     * @returns {boolean} True if expired
     * @private
     */
    _isExpired(entry) {
        return Date.now() > (entry.timestamp + entry.ttl);
    }

    /**
     * Calculate data size (approximate)
     * @param {*} data - Data to measure
     * @returns {number} Approximate size in bytes
     * @private
     */
    _calculateSize(data) {
        try {
            return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
        } catch (error) {
            return 0;
        }
    }

    /**
     * Calculate total cache size
     * @returns {number} Total size in bytes
     * @private
     */
    _calculateTotalSize() {
        let total = 0;
        for (const entry of this.cache.values()) {
            total += entry.size;
        }
        return total;
    }

    /**
     * Evict oldest entry based on LRU
     * @private
     */
    _evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, time] of this.accessTimes) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
            this.stats.evictions++;

            if (this.options.debugMode) {
                console.log(`Cache evicted (LRU): ${oldestKey}`);
            }
        }
    }

    /**
     * Enforce maximum cache size
     * @private
     */
    _enforceMaxSize() {
        while (this.cache.size > this.options.maxSize) {
            this._evictOldest();
        }
    }

    /**
     * Start automatic cleanup timer
     * @private
     */
    _startCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.options.cleanupInterval);
    }

    /**
     * Stop automatic cleanup timer
     * @private
     */
    _stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }

    /**
     * Save cache to storage
     * @private
     */
    _saveToStorage() {
        if (typeof localStorage === 'undefined') {
            return;
        }

        try {
            const data = {
                cache: Array.from(this.cache.entries()),
                accessTimes: Array.from(this.accessTimes.entries()),
                hitCounts: Array.from(this.hitCounts.entries()),
                stats: this.stats,
                timestamp: Date.now()
            };

            localStorage.setItem(this.options.storageKey, JSON.stringify(data));

        } catch (error) {
            console.warn('Failed to save cache to storage:', error);
        }
    }

    /**
     * Load cache from storage
     * @private
     */
    _loadFromStorage() {
        if (typeof localStorage === 'undefined') {
            return;
        }

        try {
            const stored = localStorage.getItem(this.options.storageKey);
            if (!stored) {
                return;
            }

            const data = JSON.parse(stored);

            // Restore cache entries (filter out expired ones)
            if (data.cache) {
                data.cache.forEach(([key, entry]) => {
                    if (!this._isExpired(entry)) {
                        this.cache.set(key, entry);
                    }
                });
            }

            // Restore access times
            if (data.accessTimes) {
                data.accessTimes.forEach(([key, time]) => {
                    if (this.cache.has(key)) {
                        this.accessTimes.set(key, time);
                    }
                });
            }

            // Restore hit counts
            if (data.hitCounts) {
                data.hitCounts.forEach(([key, count]) => {
                    if (this.cache.has(key)) {
                        this.hitCounts.set(key, count);
                    }
                });
            }

            // Restore stats
            if (data.stats) {
                this.stats = { ...this.stats, ...data.stats };
            }

            if (this.options.debugMode) {
                console.log(`Cache loaded from storage: ${this.cache.size} entries`);
            }

        } catch (error) {
            console.warn('Failed to load cache from storage:', error);
        }
    }

    /**
     * Cleanup cache resources
     */
    destroy() {
        this._stopCleanupTimer();
        this.clear();

        if (this.options.debugMode) {
            console.log('PollCache destroyed');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PollCache;
}