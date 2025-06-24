// Elements
const statusEl = document.getElementById('status');
const versionEl = document.getElementById('version');
const counterEl = document.getElementById('counter');
const actionBtn = document.getElementById('actionBtn');
const themeBtn = document.getElementById('themeBtn');
const hideBtn = document.getElementById('hideBtn');
const closeBtn = document.getElementById('closeBtn');

// State
let counter = 0;
let isDark = false;

// Initialize
async function init() {
    try {
        const version = await window.electronAPI.getAppVersion();
        versionEl.textContent = `v${version}`;
        updateStatus('Ready');
    } catch (error) {
        updateStatus('Error');
    }
}

// Update status
function updateStatus(status) {
    statusEl.textContent = status;
}

// Update counter
function updateCounter() {
    counterEl.textContent = counter;
}

// Toggle theme
function toggleTheme() {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeBtn.textContent = isDark ? '☀️' : '🌙';
}

// Handle action
function handleAction() {
    counter++;
    updateCounter();
    updateStatus('Processing...');
    
    setTimeout(() => {
        updateStatus('Done');
        setTimeout(() => updateStatus('Ready'), 1000);
    }, 500);
}

// Handle hide
function handleHide() {
    window.electronAPI.toggleWindowVisibility();
}

// Handle close
function handleClose() {
    window.electronAPI.toggleWindowVisibility();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    actionBtn.addEventListener('click', handleAction);
    themeBtn.addEventListener('click', toggleTheme);
    hideBtn.addEventListener('click', handleHide);
    closeBtn.addEventListener('click', handleClose);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            handleHide();
        }
    });
}); 