// Privacy Upload Handler - Intercepts file inputs to scramble filenames and remove metadata
// Uses timing-based interception to process files before Flow.js sees them

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window._privacyUploadInitialized) {
        console.log('[PrivacyUpload] Already initialized, skipping');
        return;
    }
    window._privacyUploadInitialized = true;
    
    console.log('[PrivacyUpload] Starting privacy upload handler');
    
    // Use the cross-browser API wrapper
    const uploadAPI = (typeof BrowserAPI !== 'undefined') ? BrowserAPI : 
                      (typeof browser !== 'undefined') ? browser : chrome;

    // Message constants - wait for them to be available
    function waitForMessageConstants() {
        return new Promise((resolve) => {
            if (window.BetterLooksmaxMessages) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.BetterLooksmaxMessages) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 10);
            }
        });
    }

    // Register with message router for bidirectional sync
    async function registerWithMessageRouter() {
        await waitForMessageConstants();
        
        if (window.BetterLooksmaxRouter) {
            window.BetterLooksmaxRouter.registerFeature('privacyUpload', handleMessage);
            console.log('[PrivacyUpload] Registered with message router');
        } else {
            // Wait for router to be available
            setTimeout(registerWithMessageRouter, 100);
        }
    }

    // Handle messages from popup/other components
    function handleMessage(message) {
        const { MESSAGE_TYPES, SETTINGS_KEYS } = window.BetterLooksmaxMessages;
        
        if (message.type === MESSAGE_TYPES.SETTING_CHANGED) {
            const { setting, enabled } = message;
            
            if (setting === SETTINGS_KEYS.FILENAME_SCRAMBLING) {
                console.log(`[PrivacyUpload] Received filename scrambling change: ${enabled}`);
                settings.filenameScrambling = enabled;
            } else if (setting === SETTINGS_KEYS.METADATA_REMOVAL) {
                console.log(`[PrivacyUpload] Received metadata removal change: ${enabled}`);
                settings.metadataRemoval = enabled;
            }
        }
    }
    
    // Settings
    let settings = {
        filenameScrambling: true,
        metadataRemoval: true
    };
    
    // Load settings
    function loadSettings() {
        uploadAPI.storage.local.get(['filenameScrambling', 'metadataRemoval'], function(result) {
            // Validate storage data before using
            const validated = window.StorageValidator ? 
                window.StorageValidator.validateStorageData(result) : result;
            settings.filenameScrambling = validated.filenameScrambling !== undefined ? validated.filenameScrambling : true;
            settings.metadataRemoval = validated.metadataRemoval !== undefined ? validated.metadataRemoval : true;
            console.log('[PrivacyUpload] Settings loaded:', settings);
        });
    }
    
    // Generate random filename
    function generateRandomFilename(originalFilename) {
        if (!settings.filenameScrambling) {
            return originalFilename;
        }
        
        const extension = originalFilename.split('.').pop();
        const randomBytes = new Uint8Array(12);
        crypto.getRandomValues(randomBytes);
        
        const randomName = Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return `${randomName}.${extension}`;
    }
    
    // Check if filename is already scrambled (to detect processed files)
    function isAlreadyScrambled(filename) {
        // Check if filename matches our scrambled pattern: 24 hex chars + extension
        return /^[0-9a-f]{24}\.[a-zA-Z0-9]+$/i.test(filename);
    }
    
    // Remove image metadata using canvas
    async function removeImageMetadata(file) {
        if (!settings.metadataRemoval || !file.type.startsWith('image/')) {
            return file;
        }
        
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(function(blob) {
                    if (blob) {
                        resolve(blob);
                    } else {
                        resolve(file);
                    }
                }, file.type, 0.95);
            };
            
            img.onerror = function() {
                resolve(file);
            };
            
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            };
            reader.onerror = function() {
                resolve(file);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Keep track of processed files to prevent loops
    const processedFiles = new WeakSet();
    
    // Process a file completely
    async function processFile(file) {
        // Check if file is already processed or already scrambled
        if (processedFiles.has(file) || isAlreadyScrambled(file.name)) {
            console.log('[PrivacyUpload] File already processed, skipping:', file.name);
            return file;
        }
        
        console.log('[PrivacyUpload] Processing file:', file.name);
        
        try {
            // Remove metadata first
            const cleanedData = await removeImageMetadata(file);
            
            // Generate scrambled filename
            const scrambledName = generateRandomFilename(file.name);
            
            // Create processed file
            const processedFile = new File(
                [cleanedData], 
                scrambledName, 
                {
                    type: file.type,
                    lastModified: Date.now()
                }
            );
            
            // Mark both original and processed files to prevent reprocessing
            processedFiles.add(file);
            processedFiles.add(processedFile);
            
            console.log('[PrivacyUpload] File processed:', file.name, '→', processedFile.name);
            return processedFile;
            
        } catch (error) {
            console.error('[PrivacyUpload] Error processing file:', error);
            return file;
        }
    }
    
    // Intercept original file input to process files before Flow.js sees them
    function interceptOriginalFileInput() {
        console.log('[PrivacyUpload] Setting up file input interception');
        
        // Find all file inputs and future ones
        function setupFileInputInterception() {
            const fileInputs = document.querySelectorAll('input[type="file"]');
            
            fileInputs.forEach(input => {
                if (input._privacyIntercepted) return; // Already intercepted
                
                console.log('[PrivacyUpload] Intercepting file input:', input);
                input._privacyIntercepted = true;
                
                // Override the change event at the earliest possible moment
                input.addEventListener('change', async function(e) {
                    // Skip if this is our own synthetic event
                    if (e._privacyProcessed) {
                        console.log('[PrivacyUpload] EARLY: Skipping synthetic event');
                        return;
                    }
                    
                    console.log('[PrivacyUpload] EARLY: File input change detected');
                    
                    if (e.target.files.length > 0) {
                        // Check if files are already processed
                        const files = Array.from(e.target.files);
                        const alreadyProcessed = files.every(file => 
                            processedFiles.has(file) || isAlreadyScrambled(file.name)
                        );
                        
                        if (alreadyProcessed) {
                            console.log('[PrivacyUpload] EARLY: All files already processed, allowing event');
                            return;
                        }
                        
                        // Stop the event immediately to prevent Flow.js from seeing original files
                        e.stopImmediatePropagation();
                        e.preventDefault();
                        
                        console.log('[PrivacyUpload] EARLY: Processing files before Flow.js...');
                        
                        const processedFilesList = [];
                        
                        // Process all files immediately
                        for (const file of files) {
                            try {
                                const processedFile = await processFile(file);
                                processedFilesList.push(processedFile);
                            } catch (error) {
                                console.error('[PrivacyUpload] Error processing file:', file.name, error);
                                processedFilesList.push(file); // Use original if processing fails
                            }
                        }
                        
                        // Replace files in the input with processed versions
                        const dt = new DataTransfer();
                        processedFilesList.forEach(file => dt.items.add(file));
                        e.target.files = dt.files;
                        
                        console.log('[PrivacyUpload] EARLY: Files replaced, dispatching new change event');
                        
                        // Now dispatch a new change event with processed files
                        // Mark the event to prevent our own handler from processing it again
                        setTimeout(() => {
                            const newEvent = new Event('change', { bubbles: true, cancelable: true });
                            newEvent._privacyProcessed = true; // Mark as our own event
                            e.target.dispatchEvent(newEvent);
                        }, 10);
                    }
                }, true); // Use capture phase to run before other listeners
            });
        }
        
        // Set up interception immediately
        setupFileInputInterception();
        
        // Watch for new file inputs added dynamically
        if (document.body) {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        setupFileInputInterception();
                    }
                }
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            // If body isn't ready, wait for it
            const bodyObserver = new MutationObserver(() => {
                if (document.body) {
                    bodyObserver.disconnect();
                    const observer = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            if (mutation.type === 'childList') {
                                setupFileInputInterception();
                            }
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            });
            bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
        }
    }
    
    // Initialize
    function initialize() {
        console.log('[PrivacyUpload] Initializing...');
        console.log('[PrivacyUpload] Document state:', document.readyState);
        console.log('[PrivacyUpload] Body available:', !!document.body);
        
        registerWithMessageRouter();
        loadSettings();
        
        // Listen for settings changes (only our privacy settings)
        uploadAPI.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                let privacySettingsChanged = false;
                
                if (changes.filenameScrambling !== undefined) {
                    settings.filenameScrambling = changes.filenameScrambling.newValue;
                    privacySettingsChanged = true;
                }
                if (changes.metadataRemoval !== undefined) {
                    settings.metadataRemoval = changes.metadataRemoval.newValue;
                    privacySettingsChanged = true;
                }
                
                // Only log when OUR settings actually changed
                if (privacySettingsChanged) {
                    console.log('[PrivacyUpload] Privacy settings updated:', {
                        filenameScrambling: settings.filenameScrambling,
                        metadataRemoval: settings.metadataRemoval
                    });
                }
            }
        });
        
        // Set up file input interception immediately (timing approach)
        try {
            interceptOriginalFileInput();
        } catch (error) {
            console.error('[PrivacyUpload] Error setting up file input interception:', error);
        }
        
        console.log('[PrivacyUpload] Privacy upload handler initialized');
    }
    
    // Start when ready
    initialize();
    
})();