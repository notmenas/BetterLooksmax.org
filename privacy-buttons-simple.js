// Privacy Upload Buttons Component - Simplified Test
console.log('[PrivacyButtons] Simple test file loading!');

// Immediately expose functions to window
window.createFilenameScramblingButton = function() {
    console.log('[PrivacyButtons] Creating filename scrambling button');
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'p-navgroup-link p-navgroup-link--iconic filename-scrambling-button';
    button.setAttribute('title', 'Filename Scrambling');
    button.setAttribute('aria-label', 'Filename Scrambling');
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-random';
    icon.style.fontSize = '16px';
    button.appendChild(icon);
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Filename scrambling clicked!');
    });
    
    return button;
};

window.createMetadataRemovalButton = function() {
    console.log('[PrivacyButtons] Creating metadata removal button');
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'p-navgroup-link p-navgroup-link--iconic metadata-removal-button';
    button.setAttribute('title', 'Metadata Removal');
    button.setAttribute('aria-label', 'Metadata Removal');
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-eraser';
    icon.style.fontSize = '16px';
    button.appendChild(icon);
    
    button.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Metadata removal clicked!');
    });
    
    return button;
};

console.log('[PrivacyButtons] Functions attached to window:', {
    createFilenameScramblingButton: typeof window.createFilenameScramblingButton,
    createMetadataRemovalButton: typeof window.createMetadataRemovalButton
});