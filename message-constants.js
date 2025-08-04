// Message Constants for BetterLooksmax.org Extension
// Centralized message types for consistent communication between popup, background, and content scripts

// Message Types
const MESSAGE_TYPES = {
    // Settings synchronization
    SETTING_CHANGED: 'settingChanged',
    STATE_UPDATE: 'stateUpdate',
    REQUEST_STATE: 'requestState',
    
    // Feature-specific messages
    TOGGLE_GREY_FILTER: 'toggleGreyFilter',
    TOGGLE_PUBLIC_MODE: 'togglePublicMode',
    TOGGLE_NSFW_FILTER: 'toggleNsfwFilter',
    TOGGLE_OP_FILTER: 'toggleOpFilter',
    TOGGLE_TIMER: 'toggleTimer',
    
    // Privacy upload messages
    TOGGLE_FILENAME_SCRAMBLING: 'toggleFilenameScrambling',
    TOGGLE_METADATA_REMOVAL: 'toggleMetadataRemoval',
    
    // CSS and styling
    APPLY_CSS: 'applyCSS',
    
    // UI updates
    UPDATE_POPUP_STATE: 'updatePopupState',
    UPDATE_ONSITE_CONTROLS: 'updateOnsiteControls'
};

// Feature Settings Keys
const SETTINGS_KEYS = {
    GREY_FILTER: 'greyFilter',
    PUBLIC_MODE: 'publicMode',
    NSFW_FILTER: 'nsfwFilter',
    OP_FILTER: 'opFilter',
    TIMER_ENABLED: 'timerEnabled',
    FILENAME_SCRAMBLING: 'filenameScrambling',
    METADATA_REMOVAL: 'metadataRemoval',
    
    // Storage-specific keys
    IS_GREY_USERS_HIDDEN: 'isGreyUsersHidden',
    IS_PUBLIC_MODE: 'isPublicMode'
};

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = { MESSAGE_TYPES, SETTINGS_KEYS };
} else {
    // Browser environment
    window.BetterLooksmaxMessages = { MESSAGE_TYPES, SETTINGS_KEYS };
}