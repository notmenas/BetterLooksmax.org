// Text Formatting Presets System
(function() {
    // Store jQuery reference
    let $jQuery;

    // Presets for text formatting
    const TEXT_PRESETS = {
        'default': {
            name: 'Default',
            icon: 'fas fa-font',
            shortcut: null,
            styles: {
                bold: false,
                italic: false,
                fontSize: null,
                fontFamily: null,
                gradient: null,
                color: null
            }
        },
    };

    // Storage key for presets
    const PRESETS_STORAGE_KEY = 'textFormatPresets';
    const SHORTCUTS_STORAGE_KEY = 'textFormatShortcuts';

    // Storage key for hidden presets
    const HIDDEN_PRESETS_STORAGE_KEY = 'hiddenTextFormatPresets';

    // Multi-point gradient system variables (global scope)
    let textGradientColorPoints = [
        { id: 'start', color: '#FF0000', label: 'Start' },
        { id: 'end', color: '#0000FF', label: 'End' }
    ];
    
    let backgroundGradientColorPoints = [
        { id: 'start', color: '#FF0000', label: 'Start' },
        { id: 'end', color: '#0000FF', label: 'End' }
    ];
    
    // Global gradient helper functions
    function createPresetColorPointElement(point, index, isBackground = false) {
        const popup = document.querySelector('.presets-popup');
        if (!popup) return null;
        
        const pointDiv = document.createElement('div');
        pointDiv.className = 'preset-color-point';
        pointDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        `;

        const label = document.createElement('label');
        label.textContent = point.label;
        label.style.cssText = `
            font-size: 11px;
            color: #ccc;
            min-width: 35px;
        `;

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = point.color;
        colorInput.style.cssText = `
            width: 32px;
            height: 28px;
            border: 1px solid #333;
            border-radius: 3px;
            padding: 1px;
            background: #1a1a1a;
            cursor: pointer;
        `;

        // Update color point when changed
        colorInput.addEventListener('input', () => {
            point.color = colorInput.value;
            if (isBackground) {
                updatePresetBackgroundGradientPreview();
            } else {
                updatePresetTextGradientPreview();
            }
        });

        pointDiv.appendChild(label);
        pointDiv.appendChild(colorInput);

        // Add remove button for middle points (not start/end)
        const colorPoints = isBackground ? backgroundGradientColorPoints : textGradientColorPoints;
        if (index > 0 && index < colorPoints.length - 1) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.style.cssText = `
                width: 20px;
                height: 20px;
                background: #ff4444;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                line-height: 1;
            `;
            removeBtn.addEventListener('click', () => {
                colorPoints.splice(index, 1);
                if (isBackground) {
                    rebuildPresetBackgroundGradientPoints();
                } else {
                    rebuildPresetTextGradientPoints();
                }
            });
            pointDiv.appendChild(removeBtn);
        }

        return pointDiv;
    }
    
    function rebuildPresetTextGradientPoints() {
        const popup = document.querySelector('.presets-popup');
        if (!popup) return;
        
        // Update labels for middle points
        textGradientColorPoints.forEach((point, index) => {
            if (index === 0) {
                point.label = 'Start';
            } else if (index === textGradientColorPoints.length - 1) {
                point.label = 'End';
            } else {
                point.label = `Point ${index}`;
            }
        });

        // Rebuild UI
        const container = popup.querySelector('#textGradientColorPoints');
        if (!container) return;
        
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        textGradientColorPoints.forEach((point, index) => {
            const element = createPresetColorPointElement(point, index, false);
            if (element) {
                container.appendChild(element);
            }
        });

        updatePresetTextGradientPreview();
    }
    
    function rebuildPresetBackgroundGradientPoints() {
        const popup = document.querySelector('.presets-popup');
        if (!popup) return;
        
        // Update labels for middle points
        backgroundGradientColorPoints.forEach((point, index) => {
            if (index === 0) {
                point.label = 'Start';
            } else if (index === backgroundGradientColorPoints.length - 1) {
                point.label = 'End';
            } else {
                point.label = `Point ${index}`;
            }
        });

        // Rebuild UI
        const container = popup.querySelector('#backgroundGradientColorPoints');
        if (!container) return;
        
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        backgroundGradientColorPoints.forEach((point, index) => {
            const element = createPresetColorPointElement(point, index, true);
            if (element) {
                container.appendChild(element);
            }
        });

        updatePresetBackgroundGradientPreview();
    }
    
    function updatePresetTextGradientPreview() {
        const popup = document.querySelector('.presets-popup');
        if (!popup) return;
        
        const preview = popup.querySelector('#textGradientPreview');
        if (!preview) return;

        const colors = textGradientColorPoints.map(point => point.color).join(', ');
        preview.style.background = `linear-gradient(to right, ${colors})`;
    }
    
    function updatePresetBackgroundGradientPreview() {
        const popup = document.querySelector('.presets-popup');
        if (!popup) return;
        
        const preview = popup.querySelector('#backgroundGradientPreview');
        if (!preview) return;

        const colors = backgroundGradientColorPoints.map(point => point.color).join(', ');
        preview.style.background = `linear-gradient(to right, ${colors})`;
    }

    // Storage helper functions - using only chrome.storage for security
    const Storage = {
        async get(key) {
            try {
                return new Promise((resolve) => {
                    chrome.storage.local.get([key], (result) => {
                        if (chrome.runtime.lastError) {
                            console.warn('Storage get error:', chrome.runtime.lastError);
                            resolve(null);
                        } else {
                            resolve(result[key] || null);
                        }
                    });
                });
            } catch (error) {
                console.warn('Storage get error:', error);
                return null;
            }
        },

        async set(key, value) {
            try {
                // Validate input
                if (!key || value === undefined) {
                    throw new Error('Invalid key or value for storage');
                }
                
                // Try to serialize to catch any JSON errors early
                const serializedValue = JSON.stringify(value);
                
                // Save to chrome.storage
                return new Promise((resolve, reject) => {
                    chrome.storage.local.set({ [key]: value }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Chrome storage set failed:', chrome.runtime.lastError);
                            if (chrome.runtime.lastError.message && chrome.runtime.lastError.message.includes('quota')) {
                                reject(new Error('Storage quota exceeded. Please delete some presets or clear browser data.'));
                            } else {
                                reject(new Error('Failed to save to storage: ' + chrome.runtime.lastError.message));
                            }
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (error) {
                console.error('Storage set error:', error);
                throw error; // Re-throw the error so calling functions can handle it
            }
        }
    };

 // Create preset button in the toolbar
function createPresetButton() {

    // Find the italic button
    const italicButton = document.querySelector('#italic-1');
    if (!italicButton) {
        console.error('[PresetButton] Italic button not found');
        return;
    }

    // Find the button group that contains the italic button
    const buttonGroup = italicButton.closest('.fr-btn-grp');
    if (!buttonGroup) {
        console.error('[PresetButton] Button group not found');
        return;
    }

    // Check if button already exists
    if (document.querySelector('#presets-1')) {
        return;
    }

    console.log('[PresetButton] Creating preset button...');

    // Create the preset button
    const button = document.createElement('button');
    button.type = 'button';
    button.tabIndex = '-1';
    button.role = 'button';
    button.className = 'fr-command fr-btn';
    button.setAttribute('title', 'Format Presets');
    button.id = 'presets-1';
    button.setAttribute('data-cmd', 'presets');

    // Create the icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-brush';
    icon.setAttribute('aria-hidden', 'true');

    // Create the screen freader text
    const srText = document.createElement('span');
    srText.className = 'fr-sr-only';
    srText.textContent = 'Format Presets';

    // Add icon and screen reader text to button
    button.appendChild(icon);
    button.appendChild(srText);

    // Insert the button after the italic button
    console.log('[PresetButton] Inserting button after italic button...');
    italicButton.parentNode.insertBefore(button, italicButton.nextSibling);
    console.log('[PresetButton] Button inserted:', button);

    // Add click event listener
    button.addEventListener('click', showPresetsPopup);
    console.log('[PresetButton] Click event listener added.');
}


    // Show presets popup
    function showPresetsPopup() {
        if (document.getElementById('presetsModalContainer')) return;
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'presetsModalContainer';
        modalContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 100000; display: block;
        `;
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); z-index: 100001;
        `;
        
        // Create popup content
        const popup = document.createElement('div');
        popup.className = 'presets-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: #181824;
            color: #eee;
            padding: 28px 24px 20px 24px;
            border-radius: 12px;
            z-index: 100002;
            width: 480px;
            max-width: 95vw;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.55);
            border: 1px solid #282828;
        `;
        
        // Build popup DOM safely
        buildPopupDOM(popup);
        
        function buildPopupDOM(popup) {
            // For now, using innerHTML but will be replaced with safe DOM construction
            // TODO: Replace with createElement calls
            // Safe DOM construction helper
            const createElement = (tag, attrs = {}, children = []) => {
                const el = document.createElement(tag);
                
                if (attrs.id) el.id = attrs.id;
                if (attrs.className) el.className = attrs.className;
                if (attrs.type) el.type = attrs.type;
                if (attrs.value !== undefined) el.value = attrs.value;
                if (attrs.placeholder) el.placeholder = attrs.placeholder;
                if (attrs.style) {
                    if (typeof attrs.style === 'string') {
                        el.setAttribute('style', attrs.style);
                    } else {
                        Object.assign(el.style, attrs.style);
                    }
                }
                
                children.forEach(child => {
                    if (typeof child === 'string') {
                        el.appendChild(document.createTextNode(child));
                    } else if (child) {
                        el.appendChild(child);
                    }
                });
                
                return el;
            };

            // Title section
            const titleDiv = createElement('div', { className: 'overlay-title', style: 'margin-bottom: 20px;' }, [
                createElement('h3', { style: 'margin: 0; color: #eee; font-size: 18px;' }, ['Text Format Presets'])
            ]);

            // Main body
            const blockBody = createElement('div', { className: 'block-body', style: 'margin-bottom: 20px;' });

            // Presets container row
            blockBody.appendChild(createElement('div', { className: 'block-row', style: 'margin-bottom: 20px;' }, [
                createElement('div', { id: 'presetsContainer', style: 'max-height:200px;overflow-y:auto;margin-bottom:20px;' })
            ]));

            // Buttons row
            blockBody.appendChild(createElement('div', { className: 'block-row', style: 'margin-bottom: 20px;' }, [
                createElement('button', { id: 'createPresetBtn', className: 'button button--primary', style: 'margin-right: 10px;' }, ['Create New Preset']),
                createElement('button', { id: 'manageShortcutsBtn', className: 'button button--primary' }, ['Manage Shortcuts'])
            ]));

            // Create preset form
            const createForm = createElement('div', { id: 'createPresetForm', style: 'display: none; margin-top: 15px; border-top: 1px solid #333; padding-top: 15px;' });
            
            // Preset name input
            createForm.appendChild(createElement('div', { style: 'margin-bottom: 10px;' }, [
                createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Preset Name:']),
                createElement('input', { type: 'text', id: 'presetName', style: 'width: 100%; padding: 5px; background: #222; border: 1px solid #444; color: #eee; border-radius: 4px;' })
            ]));

            // Format options container
            const formatOptionsDiv = createElement('div', { style: 'margin-bottom: 10px;' }, [
                createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Format Options:'])
            ]);
            
            const formatOptionsContainer = createElement('div', { style: 'display: flex; flex-wrap: wrap; gap: 10px;' });
            
            // Bold checkbox
            const boldInput = createElement('input', { type: 'checkbox', id: 'presetBold' });
            formatOptionsContainer.appendChild(createElement('label', { style: 'display: flex; align-items: center; color: #eee;' }, [
                boldInput, ' Bold'
            ]));
            
            // Italic checkbox
            const italicInput = createElement('input', { type: 'checkbox', id: 'presetItalic' });
            formatOptionsContainer.appendChild(createElement('label', { style: 'display: flex; align-items: center; color: #eee;' }, [
                italicInput, ' Italic'
            ]));

            // Font size selector
            const fontSizeDiv = createElement('div', { style: 'width: 100%; margin-top: 5px;' }, [
                createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Font Size:'])
            ]);
            const fontSizeSelect = createElement('select', { id: 'presetFontSize', style: 'width: 100%; padding: 5px; background: #222; border: 1px solid #444; color: #eee; border-radius: 4px;' });
            const fontSizes = ['', '9px', '10px', '11px', '12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px', '22px', '24px', '26px', '28px', '30px', '32px', '34px', '36px'];
            fontSizes.forEach((size, index) => {
                const option = createElement('option', { value: size }, [index === 0 ? 'Default' : size.replace('px', '')]);
                fontSizeSelect.appendChild(option);
            });
            fontSizeDiv.appendChild(fontSizeSelect);
            formatOptionsContainer.appendChild(fontSizeDiv);

            // Font family selector
            const fontFamilyDiv = createElement('div', { style: 'width: 100%; margin-top: 5px;' }, [
                createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Font Family:'])
            ]);
            const fontFamilySelect = createElement('select', { id: 'presetFontFamily', style: 'width: 100%; padding: 5px; background: #222; border: 1px solid #444; color: #eee; border-radius: 4px;' });
            const fontFamilies = [
                ['', 'Default'],
                ["'Arial'", 'Arial'],
                ["'Book Antiqua'", 'Book Antiqua'],
                ["'Courier New'", 'Courier New'],
                ["'Georgia'", 'Georgia'],
                ['Tahoma', 'Tahoma'],
                ["'Times New Roman'", 'Times New Roman'],
                ["'Trebuchet MS'", 'Trebuchet MS'],
                ["'Verdana'", 'Verdana']
            ];
            fontFamilies.forEach(([value, text]) => {
                const option = createElement('option', { value }, [text]);
                fontFamilySelect.appendChild(option);
            });
            fontFamilyDiv.appendChild(fontFamilySelect);
            formatOptionsContainer.appendChild(fontFamilyDiv);

            // Text gradient options
            const textGradientDiv = createElement('div', { style: 'width: 100%; margin-top: 5px;' }, [
                createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Text Gradient:'])
            ]);
            const gradientOptions = createElement('div', { id: 'gradientOptions', style: 'margin-bottom: 10px;' });
            const gradientTypeSelect = createElement('select', { id: 'gradientType', style: 'width: 100%; padding: 5px; background: #222; border: 1px solid #444; color: #eee; border-radius: 4px; margin-bottom: 10px;' });
            const gradientTypes = [
                ['', 'None'],
                ['custom', 'Custom Gradient'],
                ['rainbow', 'Rainbow 🌈'],
                ['red', 'Red ❤️'],
                ['blue', 'Blue 💙'],
                ['green', 'Green 💚'],
                ['purple', 'Purple 💜'],
                ['fire', 'Fire 🔥'],
                ['ocean', 'Ocean 🌊']
            ];
            gradientTypes.forEach(([value, text]) => {
                const option = createElement('option', { value }, [text]);
                gradientTypeSelect.appendChild(option);
            });
            gradientOptions.appendChild(gradientTypeSelect);
            
            const customGradientControls = createElement('div', { id: 'customGradientControls', style: 'display: none;' }, [
                createElement('h5', { style: 'margin: 8px 0 8px 0; color: #eee; font-size: 13px;' }, ['Multi-Point Text Gradient']),
                createElement('div', { id: 'textGradientColorPoints', className: 'color-points-container' }),
                createElement('button', { type: 'button', id: 'addTextGradientPoint', style: 'width: 100%; padding: 6px; background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; margin-bottom: 8px;' }, ['+ Add Color Point']),
                createElement('div', { id: 'textGradientPreview', style: 'height: 30px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #333; background: linear-gradient(to right, #FF0000, #00FF00, #0000FF);' })
            ]);
            gradientOptions.appendChild(customGradientControls);
            textGradientDiv.appendChild(gradientOptions);
            formatOptionsContainer.appendChild(textGradientDiv);

            // Background gradient options
            const backgroundGradientDiv = createElement('div', { style: 'width: 100%; margin-top: 5px;' }, [
                createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Background Gradient:'])
            ]);
            const backgroundGradientOptions = createElement('div', { id: 'backgroundGradientOptions', style: 'margin-bottom: 10px;' });
            const backgroundGradientTypeSelect = createElement('select', { id: 'backgroundGradientType', style: 'width: 100%; padding: 5px; background: #222; border: 1px solid #444; color: #eee; border-radius: 4px; margin-bottom: 10px;' });
            gradientTypes.forEach(([value, text]) => {
                const option = createElement('option', { value }, [text]);
                backgroundGradientTypeSelect.appendChild(option);
            });
            backgroundGradientOptions.appendChild(backgroundGradientTypeSelect);
            
            const customBackgroundGradientControls = createElement('div', { id: 'customBackgroundGradientControls', style: 'display: none;' }, [
                createElement('h5', { style: 'margin: 8px 0 8px 0; color: #eee; font-size: 13px;' }, ['Multi-Point Background Gradient']),
                createElement('div', { id: 'backgroundGradientColorPoints', className: 'color-points-container' }),
                createElement('button', { type: 'button', id: 'addBackgroundGradientPoint', style: 'width: 100%; padding: 6px; background: #4a9eff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; margin-bottom: 8px;' }, ['+ Add Color Point']),
                createElement('div', { id: 'backgroundGradientPreview', style: 'height: 30px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #333; background: linear-gradient(to right, #FF0000, #00FF00, #0000FF);' })
            ]);
            backgroundGradientOptions.appendChild(customBackgroundGradientControls);
            backgroundGradientDiv.appendChild(backgroundGradientOptions);
            formatOptionsContainer.appendChild(backgroundGradientDiv);

            // Text color options
            const textColorDiv = createElement('div', { style: 'width: 100%; margin-top: 5px;' });
            textColorDiv.appendChild(createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Text Color:']));
            textColorDiv.appendChild(createElement('input', { type: 'color', id: 'presetColor', style: 'width: 100%; padding: 5px; background: #222; border: 1px solid #444; color: #eee; border-radius: 4px;' }));
            const useTextColorInput = createElement('input', { type: 'checkbox', id: 'useTextColor' });
            textColorDiv.appendChild(createElement('label', { style: 'display: flex; align-items: center; margin-top: 5px; color: #eee;' }, [
                useTextColorInput, ' Use text color'
            ]));
            formatOptionsContainer.appendChild(textColorDiv);

            // Keyboard shortcut
            const shortcutDiv = createElement('div', { style: 'width: 100%; margin-top: 5px;' }, [
                createElement('label', { style: 'display: block; margin-bottom: 5px; color: #eee;' }, ['Keyboard Shortcut:']),
                createElement('input', { type: 'text', id: 'presetShortcut', placeholder: 'e.g. CmdOrCtrl+B', style: 'width: 100%; padding: 5px; background: #222; border: 1px solid #444; color: #eee; border-radius: 4px;' }),
                createElement('small', { style: 'color: #888; display: block; margin-top: 5px;' }, ['Use CmdOrCtrl for Command (Mac) or Control (Windows)'])
            ]);
            formatOptionsContainer.appendChild(shortcutDiv);
            
            formatOptionsDiv.appendChild(formatOptionsContainer);
            createForm.appendChild(formatOptionsDiv);

            // Save/Cancel buttons
            createForm.appendChild(createElement('div', { style: 'margin-top: 15px;' }, [
                createElement('button', { id: 'savePresetBtn', className: 'button button--primary', style: 'margin-right: 10px;' }, ['Save Preset']),
                createElement('button', { id: 'cancelPresetBtn', className: 'button' }, ['Cancel'])
            ]));
            
            blockBody.appendChild(createForm);

            // Shortcuts manager
            const shortcutsManager = createElement('div', { id: 'shortcutsManager', style: 'display: none; margin-top: 15px; border-top: 1px solid #333; padding-top: 15px;' }, [
                createElement('h4', { style: 'margin-top: 0; color: #eee;' }, ['Keyboard Shortcuts']),
                createElement('div', { id: 'shortcutsList', style: 'margin-bottom: 15px;' }),
                createElement('div', { style: 'margin-top: 15px;' }, [
                    createElement('button', { id: 'closeShortcutsBtn', className: 'button' }, ['Close'])
                ])
            ]);
            blockBody.appendChild(shortcutsManager);

            // Close button row
            blockBody.appendChild(createElement('div', { className: 'formSubmitRow', style: 'margin-top: 20px; text-align: center;' }, [
                createElement('div', { className: 'formSubmitRow-main' }, [
                    createElement('div', { className: 'formSubmitRow-bar' }, [
                        createElement('button', { id: 'closePresetsModal', className: 'button' }, ['Close'])
                    ])
                ])
            ]));

            // Add everything to popup
            popup.appendChild(titleDiv);
            popup.appendChild(blockBody);
        
        // Add event listeners
        modalContainer.appendChild(overlay);
        modalContainer.appendChild(popup);
        document.body.appendChild(modalContainer);
        
        // Close modal on overlay click
        overlay.addEventListener('click', () => modalContainer.remove());
        
        // Close button
        popup.querySelector('#closePresetsModal').addEventListener('click', () => modalContainer.remove());
        
        // Create preset button
        popup.querySelector('#createPresetBtn').addEventListener('click', () => {
            popup.querySelector('#createPresetForm').style.display = 'block';
            popup.querySelector('#shortcutsManager').style.display = 'none';
            popup.querySelector('#createPresetBtn').style.display = 'none';
            popup.querySelector('#manageShortcutsBtn').style.display = 'none';
        });
        
        // Manage shortcuts button
        popup.querySelector('#manageShortcutsBtn').addEventListener('click', () => {
            popup.querySelector('#shortcutsManager').style.display = 'block';
            popup.querySelector('#createPresetForm').style.display = 'none';
            popup.querySelector('#createPresetBtn').style.display = 'none';
            popup.querySelector('#manageShortcutsBtn').style.display = 'none';
            loadShortcutsList(popup.querySelector('#shortcutsList'));
        });
        
        // Close shortcuts manager
        popup.querySelector('#closeShortcutsBtn').addEventListener('click', () => {
            popup.querySelector('#shortcutsManager').style.display = 'none';
            popup.querySelector('#createPresetBtn').style.display = 'block';
            popup.querySelector('#manageShortcutsBtn').style.display = 'block';
        });
        
        // Cancel button
        popup.querySelector('#cancelPresetBtn').addEventListener('click', () => {
            popup.querySelector('#createPresetForm').style.display = 'none';
            popup.querySelector('#createPresetBtn').style.display = 'block';
            popup.querySelector('#manageShortcutsBtn').style.display = 'block';
            
            // Reset multi-point gradients when cancelling
            textGradientColorPoints = [
                { id: 'start', color: '#FF0000', label: 'Start' },
                { id: 'end', color: '#0000FF', label: 'End' }
            ];
            backgroundGradientColorPoints = [
                { id: 'start', color: '#FF0000', label: 'Start' },
                { id: 'end', color: '#0000FF', label: 'End' }
            ];
            
            // Hide custom gradient controls
            popup.querySelector('#customGradientControls').style.display = 'none';
            popup.querySelector('#customBackgroundGradientControls').style.display = 'none';
            
            // Reset save button text in case we were editing
            const saveBtn = popup.querySelector('#savePresetBtn');
            saveBtn.textContent = 'Save Preset';
        });
        
        // Gradient type change handler
        popup.querySelector('#gradientType').addEventListener('change', (e) => {
            const customControls = popup.querySelector('#customGradientControls');
            customControls.style.display = e.target.value === 'custom' ? 'block' : 'none';
            
            // Initialize multi-point gradient when custom is selected
            if (e.target.value === 'custom') {
                rebuildPresetTextGradientPoints();
            }
        });
        
        // Background gradient type change handler
        popup.querySelector('#backgroundGradientType').addEventListener('change', (e) => {
            const customControls = popup.querySelector('#customBackgroundGradientControls');
            customControls.style.display = e.target.value === 'custom' ? 'block' : 'none';
            
            // Initialize multi-point gradient when custom is selected
            if (e.target.value === 'custom') {
                rebuildPresetBackgroundGradientPoints();
            }
        });
        
        // Add point button for text gradient
        popup.querySelector('#addTextGradientPoint').addEventListener('click', () => {
            // Insert new point before the end
            const newPoint = {
                id: `point_${Date.now()}`,
                color: '#00FF00',
                label: `Point ${textGradientColorPoints.length - 1}`
            };
            textGradientColorPoints.splice(textGradientColorPoints.length - 1, 0, newPoint);
            rebuildPresetTextGradientPoints();
        });
        
        // Add point button for background gradient
        popup.querySelector('#addBackgroundGradientPoint').addEventListener('click', () => {
            // Insert new point before the end
            const newPoint = {
                id: `point_${Date.now()}`,
                color: '#00FF00',
                label: `Point ${backgroundGradientColorPoints.length - 1}`
            };
            backgroundGradientColorPoints.splice(backgroundGradientColorPoints.length - 1, 0, newPoint);
            rebuildPresetBackgroundGradientPoints();
        });
        
        // Save preset button
        popup.querySelector('#savePresetBtn').addEventListener('click', async () => {
            const name = popup.querySelector('#presetName').value.trim();
            if (!name) {
                alert('Please enter a preset name');
                return;
            }
            
            try {
            const shortcut = popup.querySelector('#presetShortcut').value.trim();
            const gradientType = popup.querySelector('#gradientType').value;
                const backgroundGradientType = popup.querySelector('#backgroundGradientType').value;
            
            let gradient = null;
            if (gradientType === 'custom') {
                    // Get multi-point gradient colors
                    const colors = textGradientColorPoints.map(point => point.color);
                gradient = {
                    type: 'custom',
                        colors: colors
                };
            } else if (gradientType) {
                gradient = gradientType;
            }
                
                let backgroundGradient = null;
                if (backgroundGradientType === 'custom') {
                    // Get multi-point background gradient colors
                    const colors = backgroundGradientColorPoints.map(point => point.color);
                    backgroundGradient = {
                        type: 'custom',
                        colors: colors
                    };
                } else if (backgroundGradientType) {
                    backgroundGradient = backgroundGradientType;
                }
            
            const preset = {
                name,
                icon: 'fas fa-magic',
                shortcut: shortcut || null,
                styles: {
                    bold: popup.querySelector('#presetBold').checked,
                    italic: popup.querySelector('#presetItalic').checked,
                    fontSize: popup.querySelector('#presetFontSize').value || null,
                    fontFamily: popup.querySelector('#presetFontFamily').value || null,
                    gradient: gradient,
                        backgroundGradient: backgroundGradient,
                    color: popup.querySelector('#useTextColor').checked ? popup.querySelector('#presetColor').value : null
                }
            };
            
                console.log('Attempting to save preset:', preset);
            
            // Generate a unique ID for the preset
            const presetId = 'preset_' + Date.now();
            
                // Save the preset (await the promise)
                const savedId = await savePreset(presetId, preset);
            
                console.log('Preset saved successfully with ID:', savedId);
                
                // Reset form only after successful save
            popup.querySelector('#presetName').value = '';
            popup.querySelector('#presetShortcut').value = '';
            popup.querySelector('#gradientType').value = '';
                popup.querySelector('#backgroundGradientType').value = '';
            popup.querySelector('#presetBold').checked = false;
            popup.querySelector('#presetItalic').checked = false;
            popup.querySelector('#presetFontSize').value = '';
            popup.querySelector('#presetFontFamily').value = '';
            popup.querySelector('#useTextColor').checked = false;
                
                // Reset multi-point gradients
                textGradientColorPoints = [
                    { id: 'start', color: '#FF0000', label: 'Start' },
                    { id: 'end', color: '#0000FF', label: 'End' }
                ];
                backgroundGradientColorPoints = [
                    { id: 'start', color: '#FF0000', label: 'Start' },
                    { id: 'end', color: '#0000FF', label: 'End' }
                ];
            
            // Hide form and show buttons
            popup.querySelector('#createPresetForm').style.display = 'none';
            popup.querySelector('#createPresetBtn').style.display = 'block';
            popup.querySelector('#manageShortcutsBtn').style.display = 'block';
            
            // Reload presets
            loadPresets(popup.querySelector('#presetsContainer'));
                
            } catch (error) {
                console.error('Failed to save preset:', error);
                // Error message is already shown by savePreset function
            }
        });
        
        // Load existing presets
        loadPresets(popup.querySelector('#presetsContainer'));
    }

    // Load presets from storage
    async function loadPresets(container) {
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        try {
            // Get custom presets and hidden presets from storage
            const customPresets = await Storage.get(PRESETS_STORAGE_KEY) || {};
            const hiddenPresets = await Storage.get(HIDDEN_PRESETS_STORAGE_KEY) || [];
            
            // Filter out hidden default presets
            const visibleDefaults = {};
            for (const [id, preset] of Object.entries(TEXT_PRESETS)) {
                if (!hiddenPresets.includes(id)) {
                    visibleDefaults[id] = preset;
                }
            }
            
            // Combine visible defaults with custom presets
            const allPresets = { ...visibleDefaults, ...customPresets };
            
            console.log('Loaded presets:', allPresets);
            console.log('Hidden presets:', hiddenPresets);
            
            if (Object.keys(allPresets).length === 0) {
                const noPresetsP = document.createElement('p');
                noPresetsP.style.cssText = 'color: #aaa; text-align: center;';
                noPresetsP.textContent = 'No presets available.';
                container.appendChild(noPresetsP);
                return;
            }
            
            for (const [id, preset] of Object.entries(allPresets)) {
                const presetCard = document.createElement('div');
                presetCard.className = 'preset-card';
                presetCard.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 10px 0;
                    padding: 10px;
                    background: #222;
                    border-radius: 6px;
                    border: 1px solid #333;
                `;
                
                // SECURITY FIX: Escape HTML to prevent XSS
                function escapeHtml(unsafe) {
                    return unsafe
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                }
                
                const shortcutText = preset.shortcut ? `<span style="color: #888; font-size: 12px; margin-left: 10px;">${escapeHtml(preset.shortcut)}</span>` : '';
                const isDefaultPreset = TEXT_PRESETS[id] !== undefined;
                const presetType = isDefaultPreset ? '<span style="color: #666; font-size: 11px;">(default)</span>' : '<span style="color: #4a9eff; font-size: 11px;">(custom)</span>';
                
                // Build preset card DOM safely
                const cardDiv = document.createElement('div');
                cardDiv.style.cssText = 'display: flex; align-items: center; gap: 10px;';
                
                const icon = document.createElement('i');
                icon.className = preset.icon || 'fas fa-text';
                icon.style.fontSize = '16px';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = preset.name;
                
                const typeSpan = document.createElement('span');
                typeSpan.style.cssText = isDefaultPreset ? 'color: #666; font-size: 11px;' : 'color: #4a9eff; font-size: 11px;';
                typeSpan.textContent = isDefaultPreset ? '(default)' : '(custom)';
                
                cardDiv.appendChild(icon);
                cardDiv.appendChild(nameSpan);
                cardDiv.appendChild(typeSpan);
                
                if (preset.shortcut) {
                    const shortcutSpan = document.createElement('span');
                    shortcutSpan.style.cssText = 'color: #888; font-size: 11px; margin-left: 5px;';
                    shortcutSpan.textContent = `[${preset.shortcut}]`;
                    cardDiv.appendChild(shortcutSpan);
                }
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'preset-actions';
                
                const applyBtn = document.createElement('button');
                applyBtn.className = 'apply-preset button button--primary';
                applyBtn.dataset.presetId = id;
                applyBtn.style.marginRight = '5px';
                applyBtn.textContent = 'Apply';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-preset button';
                editBtn.dataset.presetId = id;
                editBtn.style.marginRight = '5px';
                editBtn.textContent = 'Edit';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-preset button button--cta';
                deleteBtn.dataset.presetId = id;
                deleteBtn.textContent = 'Delete';
                
                actionsDiv.appendChild(applyBtn);
                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);
                
                presetCard.appendChild(cardDiv);
                presetCard.appendChild(actionsDiv);
                
                container.appendChild(presetCard);
                
                // Apply preset button
                presetCard.querySelector('.apply-preset').addEventListener('click', () => {
                    applyPreset(preset);
                });
                
                // Edit preset button
                presetCard.querySelector('.edit-preset').addEventListener('click', () => {
                    showEditPresetForm(id, preset);
                });
                
                // Delete preset button (now available for all presets)
                const deleteButton = presetCard.querySelector('.delete-preset');
                deleteButton.addEventListener('click', () => {
                    deletePreset(id, () => {
                        loadPresets(container);
                    });
                });
            }
            
        } catch (error) {
            console.error('Error loading presets:', error);
            const errorP = document.createElement('p');
            errorP.style.cssText = 'color: #aaa; text-align: center;';
            errorP.textContent = 'Error loading presets. Please refresh the page.';
            container.appendChild(errorP);
        }
    }

    // Show edit preset form
    function showEditPresetForm(presetId, preset) {
        const modalContainer = document.getElementById('presetsModalContainer');
        if (!modalContainer) return;
        
        const popup = modalContainer.querySelector('.presets-popup');
        const form = popup.querySelector('#createPresetForm');
        
        // Reset multi-point gradients first
        textGradientColorPoints = [
            { id: 'start', color: '#FF0000', label: 'Start' },
            { id: 'end', color: '#0000FF', label: 'End' }
        ];
        backgroundGradientColorPoints = [
            { id: 'start', color: '#FF0000', label: 'Start' },
            { id: 'end', color: '#0000FF', label: 'End' }
        ];
        
        // Hide custom gradient controls initially
        popup.querySelector('#customGradientControls').style.display = 'none';
        popup.querySelector('#customBackgroundGradientControls').style.display = 'none';
        
        // Show the form
        form.style.display = 'block';
        popup.querySelector('#shortcutsManager').style.display = 'none';
        popup.querySelector('#createPresetBtn').style.display = 'none';
        popup.querySelector('#manageShortcutsBtn').style.display = 'none';
        
        // Fill in the form with preset data
        popup.querySelector('#presetName').value = preset.name;
        popup.querySelector('#presetShortcut').value = preset.shortcut || '';
        popup.querySelector('#presetBold').checked = preset.styles.bold;
        popup.querySelector('#presetItalic').checked = preset.styles.italic;
        popup.querySelector('#presetFontSize').value = preset.styles.fontSize || '';
        popup.querySelector('#presetFontFamily').value = preset.styles.fontFamily || '';
        
        // Handle gradient
        if (preset.styles.gradient) {
            console.log('Loading gradient data:', preset.styles.gradient);
            
            // Check if it's a custom gradient (either has type: 'custom' or has colors array)
            if ((typeof preset.styles.gradient === 'object' && preset.styles.gradient.type === 'custom') || 
                (typeof preset.styles.gradient === 'object' && preset.styles.gradient.colors)) {
                
                console.log('Loading custom gradient with colors:', preset.styles.gradient.colors);
                
                // Load multi-point gradient data first
                if (preset.styles.gradient.colors && preset.styles.gradient.colors.length > 0) {
                    textGradientColorPoints = preset.styles.gradient.colors.map((color, index) => ({
                        id: index === 0 ? 'start' : index === preset.styles.gradient.colors.length - 1 ? 'end' : `point_${index}`,
                        color: color,
                        label: index === 0 ? 'Start' : index === preset.styles.gradient.colors.length - 1 ? 'End' : `Point ${index}`
                    }));
                    console.log('Loaded text gradient points:', textGradientColorPoints);
                } else {
                    // Fallback for old format
                    textGradientColorPoints = [
                        { id: 'start', color: '#FF0000', label: 'Start' },
                        { id: 'center', color: '#00FF00', label: 'Point 1' },
                        { id: 'end', color: '#0000FF', label: 'End' }
                    ];
                }
                
                // Set dropdown and trigger change to show controls
                const gradientDropdown = popup.querySelector('#gradientType');
                gradientDropdown.value = 'custom';
                gradientDropdown.dispatchEvent(new Event('change'));
                
                // Rebuild UI after a short delay to ensure DOM is ready
                setTimeout(() => rebuildPresetTextGradientPoints(), 50);
            } else {
                // It's a predefined gradient (string)
                popup.querySelector('#gradientType').value = preset.styles.gradient;
                console.log('Loading predefined gradient:', preset.styles.gradient);
            }
        } else {
            popup.querySelector('#gradientType').value = '';
        }
        
        // Handle background gradient
        if (preset.styles.backgroundGradient) {
            console.log('Loading background gradient data:', preset.styles.backgroundGradient);
            
            // Check if it's a custom gradient (either has type: 'custom' or has colors array)
            if ((typeof preset.styles.backgroundGradient === 'object' && preset.styles.backgroundGradient.type === 'custom') || 
                (typeof preset.styles.backgroundGradient === 'object' && preset.styles.backgroundGradient.colors)) {
                
                console.log('Loading custom background gradient with colors:', preset.styles.backgroundGradient.colors);
                
                // Load multi-point background gradient data first
                if (preset.styles.backgroundGradient.colors && preset.styles.backgroundGradient.colors.length > 0) {
                    backgroundGradientColorPoints = preset.styles.backgroundGradient.colors.map((color, index) => ({
                        id: index === 0 ? 'start' : index === preset.styles.backgroundGradient.colors.length - 1 ? 'end' : `point_${index}`,
                        color: color,
                        label: index === 0 ? 'Start' : index === preset.styles.backgroundGradient.colors.length - 1 ? 'End' : `Point ${index}`
                    }));
                    console.log('Loaded background gradient points:', backgroundGradientColorPoints);
                } else {
                    // Fallback for old format
                    backgroundGradientColorPoints = [
                        { id: 'start', color: '#FF0000', label: 'Start' },
                        { id: 'center', color: '#00FF00', label: 'Point 1' },
                        { id: 'end', color: '#0000FF', label: 'End' }
                    ];
                }
                
                // Set dropdown and trigger change to show controls
                const backgroundDropdown = popup.querySelector('#backgroundGradientType');
                backgroundDropdown.value = 'custom';
                backgroundDropdown.dispatchEvent(new Event('change'));
                
                // Rebuild UI after a short delay to ensure DOM is ready
                setTimeout(() => rebuildPresetBackgroundGradientPoints(), 50);
            } else {
                // It's a predefined gradient (string)
                popup.querySelector('#backgroundGradientType').value = preset.styles.backgroundGradient;
                console.log('Loading predefined background gradient:', preset.styles.backgroundGradient);
            }
        } else {
            popup.querySelector('#backgroundGradientType').value = '';
        }
        
        // Handle color
        if (preset.styles.color) {
            popup.querySelector('#presetColor').value = preset.styles.color;
            popup.querySelector('#useTextColor').checked = true;
        } else {
            popup.querySelector('#useTextColor').checked = false;
        }
        
        // Change save button text
        const saveBtn = popup.querySelector('#savePresetBtn');
        saveBtn.textContent = 'Update Preset';
        
        // Update save button click handler
        const oldClickHandler = saveBtn.onclick;
        saveBtn.onclick = async () => {
            const name = popup.querySelector('#presetName').value.trim();
            if (!name) {
                alert('Please enter a preset name');
                return;
            }
            
            const shortcut = popup.querySelector('#presetShortcut').value.trim();
            const gradientType = popup.querySelector('#gradientType').value;
            const backgroundGradientType = popup.querySelector('#backgroundGradientType').value;
            
            let gradient = null;
            if (gradientType === 'custom') {
                // Get multi-point gradient colors
                const colors = textGradientColorPoints.map(point => point.color);
                gradient = {
                    type: 'custom',
                    colors: colors
                };
            } else if (gradientType) {
                gradient = gradientType;
            }
            
            let backgroundGradient = null;
            if (backgroundGradientType === 'custom') {
                // Get multi-point background gradient colors
                const colors = backgroundGradientColorPoints.map(point => point.color);
                backgroundGradient = {
                    type: 'custom',
                    colors: colors
                };
            } else if (backgroundGradientType) {
                backgroundGradient = backgroundGradientType;
            }
            
            const updatedPreset = {
                name,
                icon: preset.icon,
                shortcut: shortcut || null,
                styles: {
                    bold: popup.querySelector('#presetBold').checked,
                    italic: popup.querySelector('#presetItalic').checked,
                    fontSize: popup.querySelector('#presetFontSize').value || null,
                    fontFamily: popup.querySelector('#presetFontFamily').value || null,
                    gradient: gradient,
                    backgroundGradient: backgroundGradient,
                    color: popup.querySelector('#useTextColor').checked ? popup.querySelector('#presetColor').value : null
                }
            };
            
            // Save the updated preset
            await savePreset(presetId, updatedPreset);
            
            // Reset form and gradients
            form.style.display = 'none';
            popup.querySelector('#createPresetBtn').style.display = 'block';
            popup.querySelector('#manageShortcutsBtn').style.display = 'block';
            saveBtn.textContent = 'Save Preset';
            saveBtn.onclick = oldClickHandler;
            
            // Reset multi-point gradients
            textGradientColorPoints = [
                { id: 'start', color: '#FF0000', label: 'Start' },
                { id: 'end', color: '#0000FF', label: 'End' }
            ];
            backgroundGradientColorPoints = [
                { id: 'start', color: '#FF0000', label: 'Start' },
                { id: 'end', color: '#0000FF', label: 'End' }
            ];
            
            // Hide custom gradient controls
            popup.querySelector('#customGradientControls').style.display = 'none';
            popup.querySelector('#customBackgroundGradientControls').style.display = 'none';
            
            // Reload presets
            loadPresets(popup.querySelector('#presetsContainer'));
        };
    }

    // Load shortcuts list
    async function loadShortcutsList(container) {
        // Clear container safely
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        try {
            // Get custom presets and hidden presets from storage
            const customPresets = await Storage.get(PRESETS_STORAGE_KEY) || {};
            const hiddenPresets = await Storage.get(HIDDEN_PRESETS_STORAGE_KEY) || [];
            
            // Filter out hidden default presets
            const visibleDefaults = {};
            for (const [id, preset] of Object.entries(TEXT_PRESETS)) {
                if (!hiddenPresets.includes(id)) {
                    visibleDefaults[id] = preset;
                }
            }
            
            // Combine visible defaults with custom presets
            const allPresets = { ...visibleDefaults, ...customPresets };
            
            if (Object.keys(allPresets).length === 0) {
                const noShortcutsP = document.createElement('p');
                noShortcutsP.style.cssText = 'color: #aaa; text-align: center;';
                noShortcutsP.textContent = 'No presets with shortcuts found.';
                container.appendChild(noShortcutsP);
                return;
            }
            
            const shortcutsList = document.createElement('div');
            shortcutsList.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            `;
            
            for (const [id, preset] of Object.entries(allPresets)) {
                if (!preset.shortcut) continue;
                
                const shortcutItem = document.createElement('div');
                shortcutItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    background: #222;
                    border-radius: 4px;
                    border: 1px solid #333;
                `;
                
                const isDefaultPreset = TEXT_PRESETS[id] !== undefined;
                const presetType = isDefaultPreset ? ' (default)' : ' (custom)';
                
                // Build shortcut item DOM safely
                const nameDiv = document.createElement('div');
                const nameSpan = document.createElement('span');
                nameSpan.style.fontWeight = 'bold';
                nameSpan.textContent = preset.name + presetType;
                nameDiv.appendChild(nameSpan);
                
                const inputDiv = document.createElement('div');
                const shortcutInput = document.createElement('input');
                shortcutInput.type = 'text';
                shortcutInput.className = 'shortcut-input';
                shortcutInput.value = preset.shortcut || '';
                shortcutInput.dataset.presetId = id;
                shortcutInput.style.cssText = 'width: 150px; padding: 4px; background: #1a1a1a; border: 1px solid #444; color: #eee; border-radius: 4px;';
                inputDiv.appendChild(shortcutInput);
                
                shortcutItem.appendChild(nameDiv);
                shortcutItem.appendChild(inputDiv);

                
                shortcutsList.appendChild(shortcutItem);
                
                // Update shortcut on change
                shortcutItem.querySelector('.shortcut-input').addEventListener('change', async (e) => {
                    const newShortcut = e.target.value.trim();
                    await updatePresetShortcut(id, newShortcut);
                });
            }
            
            container.appendChild(shortcutsList);
        } catch (error) {
            console.error('Error loading shortcuts:', error);
            const shortcutErrorP = document.createElement('p');
            shortcutErrorP.style.cssText = 'color: #aaa; text-align: center;';
            shortcutErrorP.textContent = 'Error loading shortcuts. Please refresh the page.';
            container.appendChild(shortcutErrorP);
        }
    }

    // Update preset shortcut
    async function updatePresetShortcut(presetId, shortcut) {
        try {
            // Get custom presets from storage
            const customPresets = await Storage.get(PRESETS_STORAGE_KEY) || {};
            
            // If updating a default preset, we need to create a custom copy
            if (TEXT_PRESETS[presetId]) {
                // Create a custom copy of the default preset with new shortcut
                const defaultPreset = TEXT_PRESETS[presetId];
                customPresets[presetId] = {
                    ...defaultPreset,
                    shortcut: shortcut || null
                };
            } else if (customPresets[presetId]) {
                // Update existing custom preset
                customPresets[presetId].shortcut = shortcut || null;
            } else {
                console.warn(`Preset ${presetId} not found`);
                return;
            }
            
            await Storage.set(PRESETS_STORAGE_KEY, customPresets);
            console.log(`Updated shortcut for preset ${presetId}: ${shortcut}`);
        } catch (error) {
            console.error('Error updating shortcut:', error);
        }
    }

    // Save preset to storage
    async function savePreset(id, preset) {
        // Generate a unique ID if none provided
        if (!id) {
            id = 'preset_' + Date.now();
        }
        
        try {
            // Validate preset data
            if (!preset || !preset.name) {
                throw new Error('Invalid preset data: name is required');
            }
            
            // Validate preset structure
            if (!preset.styles || typeof preset.styles !== 'object') {
                throw new Error('Invalid preset data: styles object is required');
            }
            
            const presets = await Storage.get(PRESETS_STORAGE_KEY) || {};
            
            // Ensure we're not overwriting default presets
            if (TEXT_PRESETS[id]) {
                id = 'custom_' + id;
            }
            
            // Add the new preset
            presets[id] = preset;
            
            // Save to storage
            await Storage.set(PRESETS_STORAGE_KEY, presets);
            console.log('Preset saved successfully:', id, preset);
            
            // Reload presets in the UI
            const presetsContainer = document.querySelector('#presetsContainer');
            if (presetsContainer) {
                loadPresets(presetsContainer);
            }
            
            return id; // Return the ID for success confirmation
            
        } catch (error) {
            console.error('Error saving preset:', error);
            
            // Show more specific error message
            let errorMessage = 'Failed to save preset. ';
            if (error.message.includes('quota')) {
                errorMessage += 'Storage is full. Please delete some presets or clear browser data.';
            } else if (error.message.includes('Invalid')) {
                errorMessage += 'Invalid preset data. Please check your settings.';
            } else {
                errorMessage += 'Please try again. ' + error.message;
            }
            
            alert(errorMessage);
            throw error; // Re-throw for calling function
        }
    }

    // Delete preset from storage
    async function deletePreset(id, callback) {
        try {
            // Get current presets and hidden list
            const customPresets = await Storage.get(PRESETS_STORAGE_KEY) || {};
            const hiddenPresets = await Storage.get(HIDDEN_PRESETS_STORAGE_KEY) || [];
            
            let presetName = '';
            
            // Check if it's a default preset
            if (TEXT_PRESETS[id]) {
                presetName = TEXT_PRESETS[id].name;
                // Add to hidden list instead of actually deleting
                if (!hiddenPresets.includes(id)) {
                    hiddenPresets.push(id);
                    await Storage.set(HIDDEN_PRESETS_STORAGE_KEY, hiddenPresets);
                }
            } else if (customPresets[id]) {
                presetName = customPresets[id].name;
                // Actually delete custom presets
                delete customPresets[id];
                await Storage.set(PRESETS_STORAGE_KEY, customPresets);
            } else {
                alert('Preset not found.');
                return;
            }
            
            // Confirm deletion
            if (!confirm(`Are you sure you want to delete the preset "${presetName}"?`)) {
                // If cancelled, restore the default preset from hidden list
                if (TEXT_PRESETS[id]) {
                    const index = hiddenPresets.indexOf(id);
                    if (index > -1) {
                        hiddenPresets.splice(index, 1);
                        await Storage.set(HIDDEN_PRESETS_STORAGE_KEY, hiddenPresets);
                    }
                }
                return;
            }
            
            console.log('Preset deleted successfully:', id);
            
            // Call callback to refresh UI
            if (callback) callback();
            
        } catch (error) {
            console.error('Error deleting preset:', error);
            alert('Failed to delete preset. Please try again.');
        }
    }

    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Create multi-point gradient text
    function createMultiPointGradientText(text, colors, isBackground = false) {
        if (!colors || colors.length < 2) {
            return text;
        }

        const textLength = text.length;
        const tag = isBackground ? 'BGCOLOR' : 'COLOR';
        
        // Convert hex colors to RGB
        const rgbColors = colors.map(color => {
            const rgb = hexToRgb(color);
            return [rgb.r, rgb.g, rgb.b];
        });

        return text.split('').map((char, i) => {
            // Calculate which segment this character belongs to
            const position = i / Math.max(1, textLength - 1); // 0 to 1
            const segmentSize = 1 / (rgbColors.length - 1);
            const segmentIndex = Math.min(Math.floor(position / segmentSize), rgbColors.length - 2);
            const segmentPosition = (position - segmentIndex * segmentSize) / segmentSize;

            // Interpolate between the two colors in this segment
            const startColor = rgbColors[segmentIndex];
            const endColor = rgbColors[segmentIndex + 1];

            const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * segmentPosition);
            const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * segmentPosition);
            const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * segmentPosition);

            return `[${tag}=rgb(${r}, ${g}, ${b})]${char}[/${tag}]`;
        }).join('');
    }

    // Create RGB gradient text
    function createRGBGradient(text, startColor, endColor, centerColor = null, isBackground = false) {
        // Convert to multi-point format
        const colors = centerColor ? 
            [`rgb(${startColor[0]}, ${startColor[1]}, ${startColor[2]})`, 
             `rgb(${centerColor[0]}, ${centerColor[1]}, ${centerColor[2]})`, 
             `rgb(${endColor[0]}, ${endColor[1]}, ${endColor[2]})`] :
            [`rgb(${startColor[0]}, ${startColor[1]}, ${startColor[2]})`, 
             `rgb(${endColor[0]}, ${endColor[1]}, ${endColor[2]})`];

        // Convert RGB strings back to hex for multi-point function
        const hexColors = colors.map(color => {
            const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
            if (match) {
                const r = parseInt(match[1]).toString(16).padStart(2, '0');
                const g = parseInt(match[2]).toString(16).padStart(2, '0');
                const b = parseInt(match[3]).toString(16).padStart(2, '0');
                return `#${r}${g}${b}`;
            }
            return color;
        });

        return createMultiPointGradientText(text, hexColors, isBackground);
    }

    // Create gradient text
    function createLocalGradientText(text, gradientType = 'rainbow', isForumStyle = false, isBackground = false) {
        const tag = isBackground ? 'BGCOLOR' : 'COLOR';
        
        console.log(`Creating ${isBackground ? 'background' : 'text'} gradient: ${gradientType} for text: "${text}"`);
        
        // Color palettes
        const GRADIENTS = {
            'rainbow': {
                colors: ['#FF007F', '#E60099', '#CC00B2', '#B200CC', '#9900E6', '#7F00FF', '#6600FF', '#4C1AFF', '#334CFF', '#1A66FF', '#0080FF', '#0099FF', '#00B2FF', '#00CCFF', '#00E6FF', '#00FFFF', '#00FFE6', '#00FFCC', '#00FFB2', '#00FF99', '#00FF7F', '#00FF66', '#00FF4C', '#00FF33', '#00FF1A', '#00FF00', '#1AFF00', '#33FF00', '#4CFF00', '#66FF00', '#7FFF00', '#99FF00', '#B2FF00', '#CCFF00', '#E6FF00', '#FFFF00', '#FFE600', '#FFCC00', '#FFB200', '#FF9900'],
                emoji: '🌈'
            },
            'red': {
                colors: ['#FF0000', '#FF0A0A', '#FF1414', '#FF1E1E', '#FF2828', '#FF3232', '#FF3C3C', '#FF4646', '#FF5050', '#FF5A5A', '#FF6464', '#FF6E6E', '#FF7878', '#FF8282', '#FF8C8C', '#FF9696', '#FFA0A0', '#FFAAAA', '#FFB4B4', '#FFBEBE', '#FFC8C8', '#FFD2D2', '#FFDCDC', '#FFE6E6', '#FFF0F0'],
                emoji: '❤️'
            },
            'blue': {
                colors: ['#0000FF', '#0A0AFF', '#1414FF', '#1E1EFF', '#2828FF', '#3232FF', '#3C3CFF', '#4646FF', '#5050FF', '#5A5AFF', '#6464FF', '#6E6EFF', '#7878FF', '#8282FF', '#8C8CFF', '#9696FF', '#A0A0FF', '#AAAAFF', '#B4B4FF', '#BEBEFF', '#C8C8FF', '#D2D2FF', '#DCDCFF', '#E6E6FF', '#F0F0FF'],
                emoji: '💙'
            },
            'green': {
                colors: ['#00FF00', '#0AFF0A', '#14FF14', '#1EFF1E', '#28FF28', '#32FF32', '#3CFF3C', '#46FF46', '#50FF50', '#5AFF5A', '#64FF64', '#6EFF6E', '#78FF78', '#82FF82', '#8CFF8C', '#96FF96', '#A0FFA0', '#AAFFAA', '#B4FFB4', '#BEFFBE', '#C8FFC8', '#D2FFD2', '#DCFFDC', '#E6FFE6', '#F0FFF0'],
                emoji: '💚'
            },
            'purple': {
                colors: ['#800080', '#8A0A8A', '#941494', '#9E1E9E', '#A828A8', '#B232B2', '#BC3CBC', '#C646C6', '#D050D0', '#DA5ADA', '#E464E4', '#EE6EEE', '#F878F8', '#F882F8', '#F88CF8', '#F896F8', '#F8A0F8', '#F8AAF8', '#F8B4F8', '#F8BEF8', '#F8C8F8', '#F8D2F8', '#F8DCF8', '#F8E6F8', '#F8F0F8'],
                emoji: '💜'
            },
            'fire': {
                colors: ['#FF0000', '#FF1400', '#FF2800', '#FF3C00', '#FF5000', '#FF6400', '#FF7800', '#FF8C00', '#FFA000', '#FFB400', '#FFC800', '#FFDC00', '#FFF000', '#FFFF00', '#FFFF14', '#FFFF28', '#FFFF3C', '#FFFF50', '#FFFF64', '#FFFF78', '#FFFF8C', '#FFFFA0', '#FFFFB4', '#FFFFC8', '#FFFFDC'],
                emoji: '🔥'
            },
            'ocean': {
                colors: ['#000080', '#00147A', '#00288F', '#003CA5', '#0050BB', '#0064D1', '#0078E7', '#008CFD', '#00A0FF', '#14AAFF', '#28B4FF', '#3CBEFF', '#50C8FF', '#64D2FF', '#78DCFF', '#8CE6FF', '#A0F0FF', '#B4FAFF', '#C8FFFF', '#C8FFFA', '#C8FFF0', '#C8FFE6', '#C8FFDC', '#C8FFD2', '#C8FFC8'],
                emoji: '🌊'
            }
        };

        // Forum-specific gradients
        const FORUM_GRADIENTS = {
            'Gold': {
                colors: ['#FF9100', '#FFA500', '#FFB700', '#FFC900', '#FFDB00', '#FFED00', '#FFFF00'],
                emoji: '🔸'
            },
       
        };
        
        if (isForumStyle) {
            const gradient = FORUM_GRADIENTS[gradientType];
            if (!gradient) {
                console.log(`Forum gradient "${gradientType}" not found`);
                return text;
            }

            if (gradientType === 'Gold') {
                const result = createRGBGradient(text, [255, 145, 0], [255, 206, 13], null, isBackground);
                console.log(`Generated hydrocortisone gradient: ${result}`);
                return result;
            } 
        } else {
            const gradient = GRADIENTS[gradientType];
            if (!gradient) {
                console.log(`Gradient "${gradientType}" not found`);
                return text;
            }

            const result = text.split('').map((char, i) => {
                const color = gradient.colors[i % gradient.colors.length];
                return `[${tag}=${color}]${char}[/${tag}]`;
            }).join('');
            
            console.log(`Generated ${gradientType} gradient: ${result}`);
            return result;
        }
        
        // If we reach here, return original text
        console.log(`No gradient generated, returning original text: ${text}`);
        return text;
    }

    // Apply preset to selected text
    async function applyPreset(preset) {
        try {
            const editor = document.querySelector('.fr-element');
            if (!editor) {
                console.log('No editor found');
                return;
            }

            // Get selected text
            const selection = window.getSelection();
            if (selection.rangeCount === 0) {
                console.log('No text selected');
                return;
            }
            
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            if (!selectedText) {
                console.log('Selected text is empty');
                return;
            }

            console.log('Applying preset to selected text:', selectedText);
            console.log('Preset styles:', preset.styles);

            // Build the formatted text
            let formattedText = selectedText;
            
            // First apply text gradient (if no color is set)
            if (preset.styles.gradient && !preset.styles.color) {
                console.log('Applying text gradient:', preset.styles.gradient);
                if (typeof preset.styles.gradient === 'object' && preset.styles.gradient.type === 'custom') {
                    // Custom text gradient - check if it uses new multi-point format
                    if (preset.styles.gradient.colors) {
                        // New multi-point format
                        formattedText = createMultiPointGradientText(formattedText, preset.styles.gradient.colors, false);
                    } else {
                        // Legacy 3-color format
                        const startColor = hexToRgb(preset.styles.gradient.colors[0]);
                        const centerColor = hexToRgb(preset.styles.gradient.colors[1]);
                        const endColor = hexToRgb(preset.styles.gradient.colors[2]);
                    if (startColor && endColor) {
                        formattedText = createRGBGradient(formattedText, 
                            [startColor.r, startColor.g, startColor.b],
                            [endColor.r, endColor.g, endColor.b],
                                centerColor ? [centerColor.r, centerColor.g, centerColor.b] : null,
                                false // isBackground = false for text gradient
                        );
                        }
                    }
                } else {
                    // Predefined text gradient
                    const isForumStyle = ['Gold'].includes(preset.styles.gradient);
                    formattedText = createLocalGradientText(formattedText, preset.styles.gradient, isForumStyle, false);
                }
                console.log('Text after text gradient:', formattedText);
            }
            
            // Apply background gradient
            if (preset.styles.backgroundGradient) {
                console.log('Applying background gradient:', preset.styles.backgroundGradient);
                if (typeof preset.styles.backgroundGradient === 'object' && preset.styles.backgroundGradient.type === 'custom') {
                    // Custom background gradient - check if it uses new multi-point format
                    if (preset.styles.backgroundGradient.colors) {
                        // New multi-point format
                        const backgroundGradientText = createMultiPointGradientText(selectedText, preset.styles.backgroundGradient.colors, true);
                        
                        // If we have text gradient, merge them; otherwise just use background gradient
                        if (preset.styles.gradient && !preset.styles.color) {
                            formattedText = mergeTextAndBackgroundGradients(formattedText, backgroundGradientText);
                        } else {
                            formattedText = backgroundGradientText;
                        }
                    } else {
                        // Legacy 3-color format
                        const startColor = hexToRgb(preset.styles.backgroundGradient.colors[0]);
                        const centerColor = hexToRgb(preset.styles.backgroundGradient.colors[1]);
                        const endColor = hexToRgb(preset.styles.backgroundGradient.colors[2]);
                        if (startColor && endColor) {
                            // Create background gradient from original selected text
                            const backgroundGradientText = createRGBGradient(selectedText, 
                                [startColor.r, startColor.g, startColor.b],
                                [endColor.r, endColor.g, endColor.b],
                                centerColor ? [centerColor.r, centerColor.g, centerColor.b] : null,
                                true // isBackground = true for background gradient
                            );
                            
                            // If we have text gradient, merge them; otherwise just use background gradient
                            if (preset.styles.gradient && !preset.styles.color) {
                                // Merge text and background gradients character by character
                                formattedText = mergeTextAndBackgroundGradients(formattedText, backgroundGradientText);
                            } else {
                                // No text gradient, just apply background gradient
                                formattedText = backgroundGradientText;
                            }
                        }
                    }
                } else {
                    // Predefined background gradient
                    const isForumStyle = ['Gold'].includes(preset.styles.backgroundGradient);
                    const backgroundGradientText = createLocalGradientText(selectedText, preset.styles.backgroundGradient, isForumStyle, true);
                    
                    // If we have text gradient, merge them; otherwise just use background gradient
                    if (preset.styles.gradient && !preset.styles.color) {
                        // Merge text and background gradients character by character
                        formattedText = mergeTextAndBackgroundGradients(formattedText, backgroundGradientText);
                    } else {
                        // No text gradient, just apply background gradient
                        formattedText = backgroundGradientText;
                    }
                }
                console.log('Text after background gradient:', formattedText);
            }
            
            // Apply text color (if set)
            if (preset.styles.color) {
                console.log('Applying text color:', preset.styles.color);
                formattedText = `[COLOR=${preset.styles.color}]${formattedText}[/COLOR]`;
            }
            
            // Apply font family
            if (preset.styles.fontFamily) {
                console.log('Applying font family:', preset.styles.fontFamily);
                formattedText = `[FONT=${preset.styles.fontFamily}]${formattedText}[/FONT]`;
            }
            
            // Apply font size
            if (preset.styles.fontSize) {
                console.log('Applying font size:', preset.styles.fontSize);
                formattedText = `[SIZE=${preset.styles.fontSize}]${formattedText}[/SIZE]`;
            }
            
            // Apply italic
            if (preset.styles.italic) {
                console.log('Applying italic');
                formattedText = `[I]${formattedText}[/I]`;
            }
            
            // Apply bold (outermost)
            if (preset.styles.bold) {
                console.log('Applying bold');
                formattedText = `[B]${formattedText}[/B]`;
            }

            console.log('Final formatted text:', formattedText);

            // Delete selected text and insert formatted text safely
            document.execCommand('delete', false);
            
            // Use safe insertion method instead of insertHTML to prevent XSS
            if (window.BetterLooksmaxSanitizer) {
                // Safe insertion of BBCode formatted text
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    // Insert as text node to preserve BBCode without HTML interpretation
                    const textNode = document.createTextNode(formattedText);
                    range.insertNode(textNode);
                    
                    // Move cursor to end of inserted text
                    range.setStartAfter(textNode);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } else {
                // Fallback: insert as text (safe but may not work in all editors)
                document.execCommand('insertText', false, formattedText);
            }

            // Close the modal if it exists
            const modalContainer = document.getElementById('presetsModalContainer');
            if (modalContainer) modalContainer.remove();

        } catch (error) {
            console.error('Error applying preset:', error);
        }
    }
    
    // Helper function to merge text and background gradients
    function mergeTextAndBackgroundGradients(textGradient, backgroundGradient) {
        console.log('Merging gradients:', {textGradient, backgroundGradient});
        
        // Extract individual character formatting from both gradients
        // Handle both RGB format (custom gradients) and hex format (predefined gradients)
        const textChars = textGradient.match(/\[COLOR=[^[]+?\][^[]*?\[\/COLOR\]/g) || [];
        const bgChars = backgroundGradient.match(/\[BGCOLOR=[^[]+?\][^[]*?\[\/BGCOLOR\]/g) || [];
        
        console.log('Extracted chars:', {textChars, bgChars});
        
        const result = [];
        
        for (let i = 0; i < Math.max(textChars.length, bgChars.length); i++) {
            let char = '';
            
            // Extract character and colors
            const textChar = textChars[i] || '';
            const bgChar = bgChars[i] || '';
            
            // Get the actual character
            if (textChar) {
                char = textChar.match(/\[COLOR=[^[]+?\]([^[]*?)\[\/COLOR\]/)?.[1] || '';
            } else if (bgChar) {
                char = bgChar.match(/\[BGCOLOR=[^[]+?\]([^[]*?)\[\/BGCOLOR\]/)?.[1] || '';
            }
            
            // Extract color values (handle both rgb() and hex formats)
            const textColor = textChar ? textChar.match(/\[COLOR=([^[]+?)\]/)?.[1] : null;
            const bgColor = bgChar ? bgChar.match(/\[BGCOLOR=([^[]+?)\]/)?.[1] : null;
            
            // Build combined formatting
            let formattedChar = char;
            if (textColor) {
                formattedChar = `[COLOR=${textColor}]${formattedChar}[/COLOR]`;
            }
            if (bgColor) {
                formattedChar = `[BGCOLOR=${bgColor}]${formattedChar}[/BGCOLOR]`;
            }
            
            result.push(formattedChar);
        }
        
        const mergedResult = result.join('');
        console.log('Merged result:', mergedResult);
        return mergedResult;
    }

    // Handle keyboard shortcuts
    async function handleKeyboardShortcut(e) {
        // Only handle if we're in the editor
        const editor = document.querySelector('.fr-element');
        if (!editor || !editor.contains(document.activeElement)) return;
        
        // Get the key combination
        const key = e.key.toLowerCase();
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;
        const shiftKey = e.shiftKey;
        const altKey = e.altKey;
        
        if (!modifier) return;
        
        try {
            // Get custom presets and hidden presets from storage
            const customPresets = await Storage.get(PRESETS_STORAGE_KEY) || {};
            const hiddenPresets = await Storage.get(HIDDEN_PRESETS_STORAGE_KEY) || [];
            
            // Filter out hidden default presets
            const visibleDefaults = {};
            for (const [id, preset] of Object.entries(TEXT_PRESETS)) {
                if (!hiddenPresets.includes(id)) {
                    visibleDefaults[id] = preset;
                }
            }
            
            // Combine visible defaults with custom presets
            const allPresets = { ...visibleDefaults, ...customPresets };
            
            // Find preset with matching shortcut
            for (const [id, preset] of Object.entries(allPresets)) {
                if (!preset.shortcut) continue;
                
                // Parse the shortcut
                const shortcutParts = preset.shortcut.toLowerCase().split('+');
                const shortcutKey = shortcutParts[shortcutParts.length - 1];
                const shortcutModifier = shortcutParts[0] === 'cmdorctrl';
                const shortcutShift = shortcutParts.includes('shift');
                const shortcutAlt = shortcutParts.includes('alt');
                
                // Check if this shortcut matches
                if (shortcutModifier === modifier && 
                    shortcutKey === key && 
                    shortcutShift === shiftKey && 
                    shortcutAlt === altKey) {
                    e.preventDefault();
                    
                    // Check if we're in BB code mode
                    const bbCodeButton = document.querySelector('#xfBbCode-1');
                    const isInBbCodeMode = bbCodeButton && bbCodeButton.classList.contains('fr-active');
                    
                    // If in BB code mode, switch to WYSIWYG mode first
                    if (isInBbCodeMode) {
                        bbCodeButton.click();
                        // Wait a bit for the mode switch to complete
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    
                    applyPreset(preset);
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling keyboard shortcut:', error);
        }
    }

    // Initialize when the page is loaded
    let isPresetsInitialized = false;

    function initializePresets() {
        if (isPresetsInitialized) return;

        // Wait for the editor to be ready
        const checkEditor = setInterval(() => {
            const editor = document.querySelector('.fr-element');
            const italicButton = document.querySelector('#italic-1');

            if (editor && italicButton) {
                clearInterval(checkEditor);
                isPresetsInitialized = true;
                
                // Get jQuery reference from the editor
                const editorBox = document.querySelector('.fr-box');
                if (editorBox) {
                    // Try to get jQuery from the editor's initialization
                    const editorData = editorBox.getAttribute('data-froala-editor');
                    if (editorData) {
                        try {
                            const editorConfig = JSON.parse(editorData);
                            if (editorConfig.jQuery) {
                                $jQuery = editorConfig.jQuery;
                            }
                        } catch (e) {
                            console.warn('Could not parse editor data:', e);
                        }
                    }

                    // If we still don't have jQuery, try to get it from the editor's scope
                    if (!$jQuery && editorBox.ownerDocument) {
                        const editorWindow = editorBox.ownerDocument.defaultView;
                        if (editorWindow && editorWindow.jQuery) {
                            $jQuery = editorWindow.jQuery;
                        }
                    }

                    // If we still don't have jQuery, try to get it from the parent window
                    if (!$jQuery && window.parent && window.parent.jQuery) {
                        $jQuery = window.parent.jQuery;
                    }
                }

                // Create the button
                createPresetButton();
                
                // Add keyboard shortcut listener
                document.addEventListener('keydown', handleKeyboardShortcut);
            }
        }, 100); // Check every 100ms

        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkEditor);
        }, 10000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePresets);
    } else {
        initializePresets();
    }

}
})();
