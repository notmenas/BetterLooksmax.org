/**
 * Security Utilities Module
 * Provides security helpers for the extension
 */

(function() {
    'use strict';
    
    window.SecurityUtils = {
        /**
         * Generate a cryptographically secure nonce
         */
        generateNonce: function() {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            return btoa(String.fromCharCode.apply(null, array))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        },
        
        /**
         * Validate URL against allowed origins
         */
        isAllowedOrigin: function(url) {
            const allowedOrigins = [
                'https://looksmax.org',
                'https://forum.looksmaxxing.com',
                'https://lookism.cc'
            ];
            
            try {
                const urlObj = new URL(url);
                return allowedOrigins.some(origin => urlObj.origin === origin);
            } catch (e) {
                return false;
            }
        },
        
        /**
         * Sanitize user input for display
         */
        sanitizeForDisplay: function(text) {
            if (!text) return '';
            
            // Create a text node and get its HTML representation
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        /**
         * Validate message structure
         */
        validateMessage: function(message) {
            if (!message || typeof message !== 'object') {
                return false;
            }
            
            // Check for required fields based on message type
            const validTypes = [
                'applyCSS', 'settingChanged', 'toggleTimer',
                'SETTING_CHANGED', 'REQUEST_STATE', 'updatePopupState'
            ];
            
            if (!validTypes.includes(message.type)) {
                console.warn('Invalid message type:', message.type);
                return false;
            }
            
            // Type-specific validation
            switch(message.type) {
                case 'applyCSS':
                    return typeof message.css === 'string';
                case 'settingChanged':
                case 'SETTING_CHANGED':
                    return typeof message.setting === 'string' && 
                           typeof message.enabled === 'boolean';
                case 'toggleTimer':
                    return typeof message.enabled === 'boolean';
                case 'REQUEST_STATE':
                    return true; // No additional params needed
                case 'updatePopupState':
                    return typeof message.setting === 'string' &&
                           typeof message.enabled === 'boolean';
                default:
                    return false;
            }
        },
        
        /**
         * Create safe element with content
         */
        createSafeElement: function(tag, content, attributes = {}) {
            const element = document.createElement(tag);
            
            // Set text content safely
            if (content) {
                element.textContent = content;
            }
            
            // Set attributes safely
            const safeAttributes = ['class', 'id', 'data-id', 'href', 'title'];
            for (const [key, value] of Object.entries(attributes)) {
                if (safeAttributes.includes(key)) {
                    element.setAttribute(key, String(value));
                }
            }
            
            return element;
        },
        
        /**
         * Rate limiting helper
         */
        createRateLimiter: function(func, limit, windowMs) {
            const calls = [];
            
            return function(...args) {
                const now = Date.now();
                
                // Remove old calls outside the window
                while (calls.length > 0 && calls[0] < now - windowMs) {
                    calls.shift();
                }
                
                if (calls.length < limit) {
                    calls.push(now);
                    return func.apply(this, args);
                } else {
                    console.warn('Rate limit exceeded');
                    return null;
                }
            };
        },
        
        /**
         * Secure random ID generator
         */
        generateSecureId: function(length = 16) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars[array[i] % chars.length];
            }
            return result;
        },
        
        /**
         * Validate file type for upload
         */
        isAllowedFileType: function(file) {
            const allowedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/bmp'
            ];
            
            return allowedTypes.includes(file.type);
        },
        
        /**
         * Check file size limit
         */
        isWithinSizeLimit: function(file, maxSizeMB = 10) {
            const maxBytes = maxSizeMB * 1024 * 1024;
            return file.size <= maxBytes;
        },
        
        /**
         * Create and validate nonce for session-based authentication
         */
        sessionNonce: null,
        
        createSessionNonce: function() {
            this.sessionNonce = this.generateNonce();
            return this.sessionNonce;
        },
        
        validateNonce: function(nonce) {
            return this.sessionNonce && nonce === this.sessionNonce;
        },
        
        /**
         * Escape text for safe display in DOM
         */
        escapeText: function(text) {
            if (!text) return '';
            
            const div = document.createElement('div');
            div.textContent = text;
            return div.textContent;
        },
        
        /**
         * Validate sender is from extension context
         */
        isExtensionContext: function(url) {
            if (!url) return false;
            
            return url.startsWith('chrome-extension://') || 
                   url.startsWith('moz-extension://') ||
                   url.startsWith('extension://');
        }
    };
    
    console.log('SecurityUtils: Initialized');
})();