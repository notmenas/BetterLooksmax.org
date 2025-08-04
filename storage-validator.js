/**
 * Storage Validator Module
 * Validates and sanitizes data retrieved from extension storage
 */

(function() {
    'use strict';
    
    window.StorageValidator = {
        /**
         * Validate settings object structure
         */
        validateSettings: function(settings) {
            if (!settings || typeof settings !== 'object') {
                return null;
            }
            
            const validatedSettings = {};
            
            // Validate boolean settings
            const booleanKeys = ['darkMode', 'autoSave', 'greyFilter', 'nsfwFilter', 
                                 'opFilter', 'publicMode', 'timerEnabled', 
                                 'filenameScrambling', 'metadataRemoval'];
            
            booleanKeys.forEach(key => {
                if (key in settings) {
                    validatedSettings[key] = Boolean(settings[key]);
                }
            });
            
            // Validate string settings
            if (settings.defaultSize) {
                const size = parseInt(settings.defaultSize, 10);
                if (!isNaN(size) && size >= 8 && size <= 72) {
                    validatedSettings.defaultSize = String(size);
                }
            }
            
            return validatedSettings;
        },
        
        /**
         * Validate CSS settings
         */
        validateCSSSettings: function(cssSettings) {
            if (!cssSettings || typeof cssSettings !== 'object') {
                return null;
            }
            
            const validated = {};
            
            // Validate enabled flag
            validated.enabled = Boolean(cssSettings.enabled);
            
            // Validate styles - must pass through sanitizer
            if (cssSettings.styles && typeof cssSettings.styles === 'string') {
                // Ensure sanitizer is available
                if (window.BetterLooksmaxSanitizer) {
                    validated.styles = window.BetterLooksmaxSanitizer.sanitizeCSS(cssSettings.styles);
                } else {
                    console.error('StorageValidator: CSS Sanitizer not available');
                    validated.styles = '';
                }
            } else {
                validated.styles = '';
            }
            
            return validated;
        },
        
        /**
         * Validate quick replies
         */
        validateQuickReplies: function(quickReplies) {
            if (!quickReplies || typeof quickReplies !== 'object') {
                return {};
            }
            
            const validated = {};
            const maxKeyLength = 20;
            const maxValueLength = 500;
            const maxEntries = 50;
            
            let count = 0;
            for (const [key, value] of Object.entries(quickReplies)) {
                if (count >= maxEntries) break;
                
                // Validate key and value are strings
                if (typeof key === 'string' && typeof value === 'string') {
                    // Truncate if too long
                    const safeKey = key.slice(0, maxKeyLength);
                    const safeValue = value.slice(0, maxValueLength);
                    
                    // Remove any HTML/script content
                    const cleanKey = safeKey.replace(/[<>]/g, '');
                    const cleanValue = safeValue.replace(/[<>]/g, '');
                    
                    validated[cleanKey] = cleanValue;
                    count++;
                }
            }
            
            return validated;
        },
        
        /**
         * Generic validation wrapper for storage.get
         */
        validateStorageData: function(data) {
            if (!data || typeof data !== 'object') {
                return {};
            }
            
            const validated = {};
            
            // Validate each known storage key
            if ('settings' in data) {
                const validSettings = this.validateSettings(data.settings);
                if (validSettings) {
                    validated.settings = validSettings;
                }
            }
            
            if ('cssSettings' in data) {
                const validCSS = this.validateCSSSettings(data.cssSettings);
                if (validCSS) {
                    validated.cssSettings = validCSS;
                }
            }
            
            if ('quickReplies' in data) {
                validated.quickReplies = this.validateQuickReplies(data.quickReplies);
            }
            
            // Copy over simple boolean flags
            const booleanKeys = ['isGreyUsersHidden', 'greyFilter', 'nsfwFilter', 
                               'opFilter', 'publicMode', 'timerEnabled', 
                               'filenameScrambling', 'metadataRemoval'];
            
            booleanKeys.forEach(key => {
                if (key in data) {
                    validated[key] = Boolean(data[key]);
                }
            });
            
            // Validate customCSS
            if ('customCSS' in data && typeof data.customCSS === 'string') {
                if (window.BetterLooksmaxSanitizer) {
                    validated.customCSS = window.BetterLooksmaxSanitizer.sanitizeCSS(data.customCSS);
                }
            }
            
            return validated;
        }
    };
    
    console.log('StorageValidator: Initialized');
})();