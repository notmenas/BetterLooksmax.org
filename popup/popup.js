// Popup functionality for BetterLooksmax.org extension

(function() {
    'use strict';

    // Use the cross-browser API wrapper
    const popupAPI = (typeof browser !== 'undefined') ? browser : chrome;

    // Initialize popup when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initializeTabs();
        loadSettings();
        setupEventListeners();
        setupMessageListener();
        setupStorageListener();
    });

    // Tab functionality
    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    // Load all settings from storage
    function loadSettings() {
        popupAPI.storage.local.get([
            'filenameScrambling',
            'metadataRemoval',
            'greyFilter',
            'nsfwFilter',
            'opFilter',
            'publicMode',
            'timerEnabled',
            'settings',
            // Also load the alternative keys used by on-site buttons
            'isGreyUsersHidden',
            'isPublicMode'
        ], function(result) {
            console.log('[Popup] Loaded settings:', result);
            
            // Validate storage data before using - since popup runs in extension context
            // and StorageValidator might not be available, we do basic validation
            const validated = {};
            
            // Validate boolean settings
            validated.filenameScrambling = result.filenameScrambling === true || 
                (result.filenameScrambling === undefined ? true : false);
            validated.metadataRemoval = result.metadataRemoval === true || 
                (result.metadataRemoval === undefined ? true : false);
            validated.greyFilter = result.greyFilter === true || result.isGreyUsersHidden === true;
            validated.nsfwFilter = result.nsfwFilter === true;
            validated.opFilter = result.opFilter === true;
            validated.publicMode = result.publicMode === true || result.isPublicMode === true;
            validated.timerEnabled = result.timerEnabled === true;
            
            // Apply validated settings to UI
            document.getElementById('filenameScrambling').checked = validated.filenameScrambling;
            document.getElementById('metadataRemoval').checked = validated.metadataRemoval;
            document.getElementById('greyFilter').checked = validated.greyFilter;
            document.getElementById('nsfwFilter').checked = validated.nsfwFilter;
            document.getElementById('opFilter').checked = validated.opFilter;
            document.getElementById('publicMode').checked = validated.publicMode;
            document.getElementById('timerEnabled').checked = validated.timerEnabled;

            // General settings
            if (result.settings && typeof result.settings === 'object') {
                document.getElementById('darkMode').checked = result.settings.darkMode === true;
                document.getElementById('autoSave').checked = result.settings.autoSave === true;
            }
        });
    }

    // Set up event listeners for all toggles
    function setupEventListeners() {
        // Privacy settings
        document.getElementById('filenameScrambling').addEventListener('change', function() {
            popupAPI.storage.local.set({ filenameScrambling: this.checked });
        });

        document.getElementById('metadataRemoval').addEventListener('change', function() {
            popupAPI.storage.local.set({ metadataRemoval: this.checked });
        });

        // Feature toggles
        document.getElementById('greyFilter').addEventListener('change', function() {
            // Save to both storage keys to maintain sync
            popupAPI.storage.local.set({ 
                greyFilter: this.checked,
                isGreyUsersHidden: this.checked 
            });
            notifyContentScript('greyFilter', this.checked);
        });

        document.getElementById('nsfwFilter').addEventListener('change', function() {
            popupAPI.storage.local.set({ nsfwFilter: this.checked });
            notifyContentScript('nsfwFilter', this.checked);
        });

        document.getElementById('opFilter').addEventListener('change', function() {
            popupAPI.storage.local.set({ opFilter: this.checked });
            notifyContentScript('opFilter', this.checked);
        });

        document.getElementById('publicMode').addEventListener('change', function() {
            // Save to both storage keys to maintain sync
            popupAPI.storage.local.set({ 
                publicMode: this.checked,
                isPublicMode: this.checked 
            });
            notifyContentScript('publicMode', this.checked);
        });

        document.getElementById('timerEnabled').addEventListener('change', function() {
            popupAPI.storage.local.set({ timerEnabled: this.checked });
            notifyContentScript('timerEnabled', this.checked);
        });

        // General settings
        document.getElementById('darkMode').addEventListener('change', function() {
            updateGeneralSetting('darkMode', this.checked);
        });

        document.getElementById('autoSave').addEventListener('change', function() {
            updateGeneralSetting('autoSave', this.checked);
        });
    }

    // Update general settings
    function updateGeneralSetting(key, value) {
        popupAPI.storage.local.get(['settings'], function(result) {
            const settings = result.settings || {};
            settings[key] = value;
            popupAPI.storage.local.set({ settings: settings });
        });
    }

    // Notify content scripts of setting changes
    function notifyContentScript(setting, enabled) {
        popupAPI.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                popupAPI.tabs.sendMessage(tabs[0].id, {
                    type: 'settingChanged',
                    setting: setting,
                    enabled: enabled
                }).catch(() => {
                    // Ignore errors for tabs that can't receive messages
                });
            }
        });
    }

    // Listen for state updates from content scripts
    function setupMessageListener() {
        popupAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'updatePopupState') {
                const { setting, enabled } = message;
                console.log(`[Popup] Received state update: ${setting} = ${enabled}`);
                
                // Update the appropriate toggle in the popup
                updateToggleState(setting, enabled);
            }
        });
    }

    // Update toggle state without triggering change events
    function updateToggleState(setting, enabled) {
        let elementId;
        
        // Map settings to element IDs
        switch (setting) {
            case 'greyFilter':
            case 'isGreyUsersHidden':
                elementId = 'greyFilter';
                break;
            case 'publicMode':
            case 'isPublicMode':
                elementId = 'publicMode';
                break;
            case 'nsfwFilter':
                elementId = 'nsfwFilter';
                break;
            case 'opFilter':
                elementId = 'opFilter';
                break;
            case 'timerEnabled':
                elementId = 'timerEnabled';
                break;
            case 'filenameScrambling':
                elementId = 'filenameScrambling';
                break;
            case 'metadataRemoval':
                elementId = 'metadataRemoval';
                break;
            default:
                console.warn(`[Popup] Unknown setting: ${setting}`);
                return;
        }
        
        const element = document.getElementById(elementId);
        if (element && element.checked !== enabled) {
            element.checked = enabled;
            console.log(`[Popup] Updated ${elementId} toggle to ${enabled}`);
        }
    }

    // Direct toggle update (for storage listener)
    function directUpdateToggle(elementId, enabled) {
        const element = document.getElementById(elementId);
        if (element && element.checked !== enabled) {
            element.checked = enabled;
            console.log(`[Popup] Direct updated ${elementId} toggle to ${enabled}`);
        }
    }

    // Listen for storage changes to update UI in real-time
    function setupStorageListener() {
        popupAPI.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                console.log('[Popup] Storage changed:', changes);
                
                // Update UI for each changed setting
                Object.keys(changes).forEach(key => {
                    const newValue = changes[key].newValue;
                    
                    switch (key) {
                        case 'greyFilter':
                        case 'isGreyUsersHidden':
                            directUpdateToggle('greyFilter', newValue);
                            break;
                        case 'publicMode':
                        case 'isPublicMode':
                            directUpdateToggle('publicMode', newValue);
                            break;
                        case 'nsfwFilter':
                            directUpdateToggle('nsfwFilter', newValue);
                            break;
                        case 'opFilter':
                            directUpdateToggle('opFilter', newValue);
                            break;
                        case 'timerEnabled':
                            directUpdateToggle('timerEnabled', newValue);
                            break;
                        case 'filenameScrambling':
                            directUpdateToggle('filenameScrambling', newValue);
                            break;
                        case 'metadataRemoval':
                            directUpdateToggle('metadataRemoval', newValue);
                            break;
                    }
                });
            }
        });
    }
})();