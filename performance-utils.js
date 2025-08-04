// Performance utilities for BetterLooksmax.org extension
// Provides caching, throttling, debouncing, and memory management

(function() {
    'use strict';

    // Element cache using WeakMap for automatic cleanup
    class ElementCache {
        constructor() {
            this.cache = new Map();
            this.weakCache = new WeakMap();
        }

        get(selector, context = document) {
            const key = `${selector}-${context === document ? 'document' : 'context'}`;
            
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                // Check if elements are still in DOM
                if (this.areElementsValid(cached.elements)) {
                    return cached.elements;
                }
                this.cache.delete(key);
            }

            const elements = context.querySelectorAll(selector);
            this.cache.set(key, {
                elements: Array.from(elements),
                timestamp: Date.now()
            });
            
            return Array.from(elements);
        }

        getSingle(selector, context = document) {
            const key = `single-${selector}-${context === document ? 'document' : 'context'}`;
            
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                if (cached.element && cached.element.isConnected) {
                    return cached.element;
                }
                this.cache.delete(key);
            }

            const element = context.querySelector(selector);
            if (element) {
                this.cache.set(key, {
                    element,
                    timestamp: Date.now()
                });
            }
            
            return element;
        }

        areElementsValid(elements) {
            return elements && elements.length > 0 && elements[0].isConnected;
        }

        clear() {
            this.cache.clear();
        }

        // Clean expired cache entries (older than 30 seconds)
        cleanExpired() {
            const now = Date.now();
            const maxAge = 30000; // 30 seconds
            
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > maxAge) {
                    this.cache.delete(key);
                }
            }
        }
    }

    // Global element cache instance
    const globalElementCache = new ElementCache();

    // Clean expired cache entries periodically
    setInterval(() => {
        globalElementCache.cleanExpired();
    }, 60000); // Every minute

    // Throttle function - limits execution frequency
    function throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    // Debounce function - delays execution until calls stop
    function debounce(func, delay) {
        let timeoutId;
        
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Batch DOM operations to prevent layout thrashing
    function batchDOMOperations(operations) {
        if (!Array.isArray(operations)) {
            operations = [operations];
        }

        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const results = operations.map(op => {
                    try {
                        return op();
                    } catch (error) {
                        console.error('Error in batched DOM operation:', error);
                        return null;
                    }
                });
                resolve(results);
            });
        });
    }

    // Event manager for proper cleanup
    class EventManager {
        constructor() {
            this.listeners = [];
            this.intervals = [];
            this.timeouts = [];
        }

        addListener(element, event, handler, options = false) {
            if (!element || typeof handler !== 'function') {
                console.error('Invalid element or handler for event listener');
                return;
            }

            element.addEventListener(event, handler, options);
            this.listeners.push({ element, event, handler, options });
        }

        removeListener(element, event, handler, options = false) {
            element.removeEventListener(event, handler, options);
            this.listeners = this.listeners.filter(listener => 
                !(listener.element === element && 
                  listener.event === event && 
                  listener.handler === handler)
            );
        }

        addInterval(callback, delay) {
            const id = setInterval(callback, delay);
            this.intervals.push(id);
            return id;
        }

        addTimeout(callback, delay) {
            const id = setTimeout(() => {
                callback();
                this.timeouts = this.timeouts.filter(timeoutId => timeoutId !== id);
            }, delay);
            this.timeouts.push(id);
            return id;
        }

        cleanup() {
            // Remove all event listeners
            this.listeners.forEach(({ element, event, handler, options }) => {
                try {
                    element.removeEventListener(event, handler, options);
                } catch (error) {
                    console.warn('Error removing event listener:', error);
                }
            });

            // Clear all intervals
            this.intervals.forEach(id => clearInterval(id));

            // Clear all timeouts
            this.timeouts.forEach(id => clearTimeout(id));

            // Reset arrays
            this.listeners = [];
            this.intervals = [];
            this.timeouts = [];
        }

        getListenerCount() {
            return this.listeners.length;
        }

        getIntervalCount() {
            return this.intervals.length;
        }
    }

    // Wait for element utility using Promise
    function waitForElement(selector, timeout = 5000, context = document) {
        return new Promise((resolve, reject) => {
            const element = context.querySelector(selector);
            if (element) {
                return resolve(element);
            }

            const observer = new MutationObserver((mutations) => {
                const element = context.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            const targetElement = context === document 
                ? (document.body || document.documentElement) 
                : context;
            
            if (!targetElement) {
                observer.disconnect();
                reject(new Error(`Target element for observing ${selector} is null`));
                return;
            }

            observer.observe(targetElement, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Efficient mutation observer with filtering
    class FilteredMutationObserver {
        constructor(callback, options = {}) {
            this.callback = callback;
            this.options = {
                childList: true,
                subtree: true,
                ...options
            };
            this.filters = [];
            this.observer = null;
        }

        addFilter(filterFn) {
            this.filters.push(filterFn);
        }

        observe(target) {
            if (!target || !(target instanceof Node)) {
                console.error('Invalid target for MutationObserver. Target must be a valid Node.', target);
                return;
            }

            this.observer = new MutationObserver((mutations) => {
                const filteredMutations = mutations.filter(mutation => {
                    if (this.filters.length === 0) return true;
                    
                    return this.filters.some(filter => filter(mutation));
                });

                if (filteredMutations.length > 0) {
                    this.callback(filteredMutations);
                }
            });

            this.observer.observe(target, this.options);
        }

        disconnect() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
    }
    
    // Global observer manager to consolidate all MutationObservers
    class GlobalObserverManager {
        constructor() {
            this.features = new Map();
            this.observer = null;
            this.throttleDelay = 100;
            this.throttleTimer = null;
            this.pendingMutations = [];
            this.isProcessing = false;
        }
        
        // Register a feature with its callback and optional filters
        register(featureName, callback, options = {}) {
            if (this.features.has(featureName)) {
                console.warn(`[GlobalObserver] Feature ${featureName} already registered`);
                return;
            }
            
            this.features.set(featureName, {
                callback: callback,
                enabled: true,
                priority: options.priority || 0,
                filters: options.filters || [],
                throttle: options.throttle || this.throttleDelay
            });
            
            console.log(`[GlobalObserver] Registered feature: ${featureName}`);
            
            // Start observer if this is the first feature
            if (this.features.size === 1) {
                this.start();
            }
        }
        
        // Unregister a feature
        unregister(featureName) {
            if (this.features.delete(featureName)) {
                console.log(`[GlobalObserver] Unregistered feature: ${featureName}`);
                
                // Stop observer if no features remain
                if (this.features.size === 0) {
                    this.stop();
                }
            }
        }
        
        // Enable/disable a feature
        setFeatureEnabled(featureName, enabled) {
            const feature = this.features.get(featureName);
            if (feature) {
                feature.enabled = enabled;
            }
        }
        
        // Start the global observer
        start() {
            if (this.observer) return;
            
            this.observer = new MutationObserver((mutations) => {
                // Add mutations to pending queue
                this.pendingMutations.push(...mutations);
                
                // Throttle processing
                if (!this.throttleTimer) {
                    this.throttleTimer = setTimeout(() => {
                        this.processMutations();
                        this.throttleTimer = null;
                    }, this.throttleDelay);
                }
            });
            
            // Observe document body when available
            if (document.body) {
                this.observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeOldValue: true
                });
                console.log('[GlobalObserver] Started observing');
            } else {
                // Wait for body to be available
                const startWhenReady = () => {
                    if (document.body) {
                        this.observer.observe(document.body, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeOldValue: true
                        });
                        console.log('[GlobalObserver] Started observing (delayed)');
                    } else {
                        requestAnimationFrame(startWhenReady);
                    }
                };
                startWhenReady();
            }
        }
        
        // Stop the global observer
        stop() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
                console.log('[GlobalObserver] Stopped observing');
            }
            
            if (this.throttleTimer) {
                clearTimeout(this.throttleTimer);
                this.throttleTimer = null;
            }
            
            this.pendingMutations = [];
        }
        
        // Process pending mutations
        processMutations() {
            if (this.isProcessing || this.pendingMutations.length === 0) return;
            
            this.isProcessing = true;
            const mutations = this.pendingMutations.splice(0);
            
            // Sort features by priority
            const sortedFeatures = Array.from(this.features.entries())
                .filter(([_, feature]) => feature.enabled)
                .sort((a, b) => b[1].priority - a[1].priority);
            
            // Process mutations for each feature
            for (const [featureName, feature] of sortedFeatures) {
                try {
                    // Filter mutations if filters are provided
                    let relevantMutations = mutations;
                    if (feature.filters.length > 0) {
                        relevantMutations = mutations.filter(mutation => 
                            feature.filters.some(filter => filter(mutation))
                        );
                    }
                    
                    // Call feature callback if there are relevant mutations
                    if (relevantMutations.length > 0) {
                        // Apply feature-specific throttling
                        if (feature.lastCall && Date.now() - feature.lastCall < feature.throttle) {
                            continue;
                        }
                        
                        feature.callback(relevantMutations);
                        feature.lastCall = Date.now();
                    }
                } catch (error) {
                    console.error(`[GlobalObserver] Error in feature ${featureName}:`, error);
                }
            }
            
            this.isProcessing = false;
        }
        
        // Get statistics about observer performance
        getStats() {
            return {
                registeredFeatures: this.features.size,
                pendingMutations: this.pendingMutations.length,
                isActive: !!this.observer,
                features: Array.from(this.features.keys())
            };
        }
    }

    // Performance monitoring utilities
    class PerformanceMonitor {
        constructor() {
            this.marks = new Map();
            this.measures = new Map();
        }

        mark(name) {
            this.marks.set(name, performance.now());
        }

        measure(name, startMark) {
            const startTime = this.marks.get(startMark);
            if (startTime === undefined) {
                console.warn(`Start mark "${startMark}" not found`);
                return;
            }

            const duration = performance.now() - startTime;
            this.measures.set(name, duration);
            return duration;
        }

        getMeasure(name) {
            return this.measures.get(name);
        }

        clearMarks() {
            this.marks.clear();
        }

        clearMeasures() {
            this.measures.clear();
        }

        logPerformance() {
            console.group('Performance Measurements');
            for (const [name, duration] of this.measures.entries()) {
                console.log(`${name}: ${duration.toFixed(2)}ms`);
            }
            console.groupEnd();
        }
    }

    // Export utilities to global scope
    window.BetterLooksmaxPerformance = {
        ElementCache,
        EventManager,
        FilteredMutationObserver,
        GlobalObserverManager,
        PerformanceMonitor,
        cache: globalElementCache,
        throttle,
        debounce,
        batchDOMOperations,
        waitForElement
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        globalElementCache.clear();
    });

    console.log('[Performance Utils] Loaded successfully');
})();