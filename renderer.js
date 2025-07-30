// State management
let currentModule = null;
let browserEnabled = false;
let adultMode = false;
let browserFrame = null;

// DOM elements
const elements = {
    moduleButtons: document.querySelectorAll('.module-btn'),
    browserToggle: document.getElementById('browserToggle'),
    adultModeToggle: document.getElementById('adultMode'),
    urlInput: document.getElementById('urlInput'),
    pasteBtn: document.getElementById('pasteBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    openDownloadsBtn: document.getElementById('openDownloadsBtn'),
    statusDisplay: document.getElementById('statusDisplay'),
    statusText: document.querySelector('.status-text'),
    urlDisplay: document.getElementById('urlDisplay'),
    browserContainer: document.getElementById('browserContainer'),
    browserPlaceholder: document.getElementById('browserPlaceholder'),
    downloadOptions: document.getElementById('downloadOptions'),
    chapterInputs: document.getElementById('chapterInputs'),
    titleInput: document.getElementById('titleInput'),
    startChapter: document.getElementById('startChapter'),
    endChapter: document.getElementById('endChapter'),
    refreshBtn: document.getElementById('refreshBtn'),
    backBtn: document.getElementById('backBtn'),
    forwardBtn: document.getElementById('forwardBtn'),
    goBtn: document.getElementById('goBtn'),
    downloadPath: document.getElementById('downloadPath'),
    chooseFolderBtn: document.getElementById('chooseFolderBtn')
};

// Initialize the application
function init() {
    browserFrame = document.getElementById('browserFrame');
    setupEventListeners();
    updateAdultModeVisibility();
    updateDownloadButtonState();
    loadDownloadPath();
    updateStatus('Ready');
}

// Setup all event listeners
function setupEventListeners() {
    // Inject custom CSS into webview after navigation to force background color
    if (browserFrame) {
        browserFrame.addEventListener('did-finish-load', () => {
            browserFrame.insertCSS('body, html { background: #fff !important; }');
        });
    }
    // Module button clicks
    elements.moduleButtons.forEach(btn => {
        btn.addEventListener('click', () => handleModuleSelect(btn));
    });

    // Browser toggle
    elements.browserToggle.addEventListener('change', handleBrowserToggle);

    // Adult mode toggle
    elements.adultModeToggle.addEventListener('change', handleAdultModeToggle);

    // URL input
    elements.urlInput.addEventListener('input', updateDownloadButtonState);

    // Paste button
    elements.pasteBtn.addEventListener('click', handlePasteUrl);

    // Download button
    elements.downloadBtn.addEventListener('click', handleDownload);

    // Open downloads button
    elements.openDownloadsBtn.addEventListener('click', handleOpenDownloads);

    // Browser controls
    elements.refreshBtn.addEventListener('click', () => {
        if (browserFrame && browserEnabled) {
            browserFrame.reload();
        }
    });

    elements.backBtn.addEventListener('click', () => {
        if (browserFrame && browserEnabled) {
            browserFrame.goBack();
        }
    });

    elements.forwardBtn.addEventListener('click', () => {
        if (browserFrame && browserEnabled) {
            browserFrame.goForward();
        }
    });

    // URL display navigation
    elements.urlDisplay.addEventListener('dblclick', () => {
        if (browserEnabled) {
            elements.urlDisplay.readOnly = false;
            elements.urlDisplay.select();
            elements.goBtn.style.display = 'block';
        }
    });

    elements.urlDisplay.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !elements.urlDisplay.readOnly) {
            navigateToUrl();
        }
    });

    elements.urlDisplay.addEventListener('blur', () => {
        elements.urlDisplay.readOnly = true;
        elements.goBtn.style.display = 'none';
    });

    elements.goBtn.addEventListener('click', navigateToUrl);

    // Folder selection
    elements.chooseFolderBtn.addEventListener('click', handleChooseFolder);

    // Browser events for webview
    if (browserFrame) {
        browserFrame.addEventListener('did-navigate', (event) => {
            elements.urlDisplay.value = event.url;
        });
        browserFrame.addEventListener('did-navigate-in-page', (event) => {
            elements.urlDisplay.value = event.url;
        });
        browserFrame.addEventListener('did-start-loading', () => {
            updateStatus('Loading...');
        });
        browserFrame.addEventListener('did-stop-loading', () => {
            updateStatus('Ready');
            elements.urlDisplay.value = browserFrame.getURL();
        });
    }
}

// Handle module selection
function handleModuleSelect(button) {
    // Remove active class from all buttons
    elements.moduleButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to selected button
    button.classList.add('active');
    
    // Update current module
    currentModule = button.dataset.module;
    
    // Update download options visibility
    updateDownloadOptions();
    
    // Load the module's website if browser is enabled
    if (browserEnabled && browserFrame) {
        const url = button.dataset.url;
        browserFrame.loadURL(url);
        updateStatus(`Loading ${button.querySelector('.module-name').textContent}...`);
    }
    
    updateDownloadButtonState();
    updateStatus(`Selected module: ${button.querySelector('.module-name').textContent}`);
}

// Handle browser toggle
function handleBrowserToggle(event) {
    browserEnabled = event.target.checked;
    
    if (browserEnabled) {
        // Show webview, hide placeholder
        browserFrame.style.display = 'block';
        elements.browserPlaceholder.style.display = 'none';
        // Load current module's URL if one is selected
        if (currentModule) {
            const activeButton = document.querySelector('.module-btn.active');
            if (activeButton) {
                browserFrame.loadURL(activeButton.dataset.url);
            }
        }
        updateStatus('Browser enabled');
    } else {
        // Hide webview, show placeholder
        browserFrame.style.display = 'none';
        elements.browserPlaceholder.style.display = 'flex';
        browserFrame.loadURL('about:blank');
        updateStatus('Browser disabled');
    }
    
    updateBrowserControls();
}

// Handle adult mode toggle
function handleAdultModeToggle(event) {
    adultMode = event.target.checked;
    updateAdultModeVisibility();
    updateStatus(adultMode ? 'Adult mode enabled' : 'Adult mode disabled');
}

// Update adult mode module visibility
function updateAdultModeVisibility() {
    const adultButtons = document.querySelectorAll('.module-btn.adult-mode');
    adultButtons.forEach(btn => {
        if (adultMode) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
            // If current module is adult-only and adult mode is disabled, deselect it
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentModule = null;
                updateDownloadButtonState();
            }
        }
    });
}

// Update download options based on selected module
function updateDownloadOptions() {
    if (!currentModule) {
        elements.downloadOptions.style.display = 'none';
        return;
    }
    
    elements.downloadOptions.style.display = 'block';
    
    // Show chapter inputs for Colamanga
    if (currentModule === 'colamanga') {
        elements.chapterInputs.style.display = 'flex';
    } else {
        elements.chapterInputs.style.display = 'none';
    }
}

// Handle paste URL from browser
async function handlePasteUrl() {
    try {
        if (browserEnabled && browserFrame && browserFrame.getURL() !== 'about:blank') {
            // Get URL from webview
            const url = browserFrame.getURL();
            if (url && url !== 'about:blank') {
                elements.urlInput.value = url;
                updateDownloadButtonState();
                updateStatus('URL pasted from browser');
                return;
            }
        }
        
        // Fallback to clipboard
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText && isValidUrl(clipboardText)) {
                elements.urlInput.value = clipboardText;
                updateDownloadButtonState();
                updateStatus('URL pasted from clipboard');
            } else {
                updateStatus('No valid URL found in clipboard', 'error');
            }
        } catch (clipError) {
            updateStatus('Unable to access clipboard', 'error');
        }
    } catch (error) {
        console.error('Paste error:', error);
        updateStatus('Failed to paste URL', 'error');
    }
}

// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

// Handle download
async function handleDownload() {
    if (!currentModule) {
        updateStatus('Please select a module first', 'error');
        return;
    }
    
    const url = elements.urlInput.value.trim();
    if (!url || !isValidUrl(url)) {
        updateStatus('Please enter a valid URL', 'error');
        return;
    }
    
    // Prepare download options
    const options = {
        title: elements.titleInput.value.trim() || undefined
    };
    
    // Add chapter options for Colamanga
    if (currentModule === 'colamanga') {
        const startChapter = parseInt(elements.startChapter.value);
        const endChapter = parseInt(elements.endChapter.value);
        
        if (isNaN(startChapter) || isNaN(endChapter)) {
            updateStatus('Please enter valid chapter numbers for Colamanga', 'error');
            return;
        }
        
        options.startChapter = startChapter;
        options.endChapter = endChapter;
    }
    
    // Start download
    setDownloadingState(true);
    updateStatus('Starting download...', 'loading');
    
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ module: currentModule, url, options })
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateStatus(result.message || 'Download completed successfully!', 'success');
        } else {
            updateStatus(result.message || 'Download failed', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        updateStatus('Download failed: ' + error.message, 'error');
    } finally {
        setDownloadingState(false);
    }
}

// Handle open downloads folder
async function handleOpenDownloads() {
    try {
        const response = await fetch('/api/downloads');
        const folders = await response.json();
        
        if (folders.length > 0) {
            updateStatus(`Found ${folders.length} downloaded manga folders`);
            // For web version, we can show a list of downloads or open a new tab
            console.log('Downloaded folders:', folders);
        } else {
            updateStatus('No downloads found');
        }
    } catch (error) {
        updateStatus('Error checking downloads', 'error');
    }
}

// Update download button state
function updateDownloadButtonState() {
    const hasModule = !!currentModule;
    const hasUrl = elements.urlInput.value.trim() !== '';
    const isValid = hasModule && hasUrl;
    
    elements.downloadBtn.disabled = !isValid;
}

// Set downloading state
function setDownloadingState(downloading) {
    elements.downloadBtn.disabled = downloading;
    
    if (downloading) {
        elements.downloadBtn.classList.add('loading');
        elements.downloadBtn.querySelector('.btn-text').textContent = 'Downloading...';
        elements.downloadBtn.querySelector('.btn-icon').textContent = '⟳';
    } else {
        elements.downloadBtn.classList.remove('loading');
        elements.downloadBtn.querySelector('.btn-text').textContent = 'Download';
        elements.downloadBtn.querySelector('.btn-icon').textContent = '⬇';
        updateDownloadButtonState();
    }
}

// Update URL display
function updateUrlDisplay() {
    if (browserEnabled && browserFrame) {
        try {
            // In desktop environment, this will work for same-origin or when web security is disabled
            if (browserFrame.contentWindow && browserFrame.contentWindow.location.href !== 'about:blank') {
                elements.urlDisplay.value = browserFrame.contentWindow.location.href;
            } else {
                elements.urlDisplay.value = browserFrame.src || 'about:blank';
            }
        } catch (e) {
            // Fallback for cross-origin restrictions in web environment
            elements.urlDisplay.value = browserFrame.src || 'about:blank';
        }
    } else {
        elements.urlDisplay.value = 'about:blank';
    }
}

// Update browser controls
function updateBrowserControls() {
    if (browserEnabled && browserFrame) {
        elements.backBtn.disabled = false;
        elements.forwardBtn.disabled = false;
        elements.refreshBtn.disabled = false;
    } else {
        elements.backBtn.disabled = true;
        elements.forwardBtn.disabled = true;
        elements.refreshBtn.disabled = true;
    }
}

// Update status display
function updateStatus(message, type = 'info') {
    elements.statusText.textContent = message;
    
    // Remove existing status classes
    elements.statusDisplay.classList.remove('success', 'error', 'loading');
    
    // Add new status class
    if (type !== 'info') {
        elements.statusDisplay.classList.add(type);
    }
    
    // Auto-clear status after 5 seconds for success/error messages
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            if (elements.statusText.textContent === message) {
                updateStatus('Ready');
            }
        }, 5000);
    }
}

// Navigate to URL function
function navigateToUrl() {
    const url = elements.urlDisplay.value.trim();
    if (url && isValidUrl(url) && browserFrame && browserEnabled) {
        browserFrame.loadURL(url);
        elements.urlDisplay.readOnly = true;
        elements.goBtn.style.display = 'none';
        updateStatus(`Navigating to ${url}...`);
    } else if (!isValidUrl(url)) {
        updateStatus('Please enter a valid URL', 'error');
    }
}

// Load download path from server
async function loadDownloadPath() {
    try {
        const response = await fetch('/api/download-path');
        const data = await response.json();
        elements.downloadPath.value = data.path;
    } catch (error) {
        console.error('Error loading download path:', error);
    }
}

// Handle folder selection
async function handleChooseFolder() {
    try {
        // For web version, we'll use a simple prompt for now
        // In desktop version, this would use Electron's dialog
        const newPath = prompt('Enter the download folder path:', elements.downloadPath.value);
        
        if (newPath && newPath.trim()) {
            const response = await fetch('/api/set-download-path', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: newPath.trim() })
            });
            
            const result = await response.json();
            
            if (result.success) {
                elements.downloadPath.value = result.path;
                updateStatus('Download folder updated successfully', 'success');
            } else {
                updateStatus('Failed to set download folder: ' + result.error, 'error');
            }
        }
    } catch (error) {
        updateStatus('Error setting download folder: ' + error.message, 'error');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
