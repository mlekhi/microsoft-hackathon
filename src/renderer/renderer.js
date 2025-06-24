// DOM elements
const versionElement = document.getElementById('version');
const platformElement = document.getElementById('platform');
const statusElement = document.getElementById('status');
const lastActionElement = document.getElementById('lastAction');
const newButton = document.getElementById('newButton');
const themeToggle = document.getElementById('themeToggle');

// State
let isDarkTheme = false;
let actionCount = 0;

// Initialize the app
async function initializeApp() {
    try {
        // Get app version and platform from main process
        const version = await window.electronAPI.getAppVersion();
        const platform = await window.electronAPI.getPlatform();
        
        // Update UI with app info
        versionElement.textContent = `v${version}`;
        platformElement.textContent = formatPlatform(platform);
        
        // Set initial status
        updateStatus('Ready');
        updateLastAction('App initialized');
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        updateStatus('Error initializing');
    }
}

// Format platform name for display
function formatPlatform(platform) {
    const platformMap = {
        'darwin': 'macOS',
        'win32': 'Windows',
        'linux': 'Linux'
    };
    return platformMap[platform] || platform;
}

// Update status display
function updateStatus(status) {
    statusElement.textContent = status;
    statusElement.style.color = getStatusColor(status);
}

// Update last action display
function updateLastAction(action) {
    lastActionElement.textContent = action;
}

// Get color for status
function getStatusColor(status) {
    const colors = {
        'Ready': '#10b981',
        'Loading': '#f59e0b',
        'Error': '#ef4444',
        'Success': '#10b981'
    };
    return colors[status] || '#64748b';
}

// Toggle theme
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
    
    // Update button text
    const icon = themeToggle.querySelector('.btn-icon');
    icon.textContent = isDarkTheme ? '☀️' : '🌙';
    
    updateLastAction(`Theme switched to ${isDarkTheme ? 'dark' : 'light'} mode`);
}

// Handle new item action
function handleNewItem() {
    actionCount++;
    updateStatus('Processing...');
    
    // Simulate some work
    setTimeout(() => {
        updateStatus('Success');
        updateLastAction(`Created new item #${actionCount}`);
        
        // Reset status after a delay
        setTimeout(() => {
            updateStatus('Ready');
        }, 2000);
    }, 1000);
}

// Add click animations to feature cards
function addFeatureCardAnimations() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            // Add click animation
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
            
            // Update last action
            const title = card.querySelector('h3').textContent;
            updateLastAction(`Clicked on: ${title}`);
        });
    });
}

// Handle menu events from main process
function setupMenuListeners() {
    window.electronAPI.onMenuNew(() => {
        handleNewItem();
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    initializeApp();
    
    // Setup event listeners
    newButton.addEventListener('click', handleNewItem);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Add feature card animations
    addFeatureCardAnimations();
    
    // Setup menu listeners
    setupMenuListeners();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N for new item
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            handleNewItem();
        }
        
        // Ctrl/Cmd + T for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            toggleTheme();
        }
    });
    
    // Add some interactive features
    addInteractiveFeatures();
});

// Add interactive features
function addInteractiveFeatures() {
    // Add hover effects to status items
    const statusItems = document.querySelectorAll('.status-item');
    statusItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'var(--bg-tertiary)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
    });
    
    // Add click to copy functionality for version and platform
    [versionElement, platformElement].forEach(element => {
        element.style.cursor = 'pointer';
        element.title = 'Click to copy';
        
        element.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(element.textContent);
                updateLastAction(`Copied: ${element.textContent}`);
                
                // Visual feedback
                const originalText = element.textContent;
                element.textContent = 'Copied!';
                element.style.color = '#10b981';
                
                setTimeout(() => {
                    element.textContent = originalText;
                    element.style.color = '';
                }, 1000);
            } catch (error) {
                console.error('Failed to copy text:', error);
            }
        });
    });
}

// Handle window focus/blur events
window.addEventListener('focus', () => {
    updateStatus('Ready');
});

window.addEventListener('blur', () => {
    updateStatus('Background');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Remove all listeners to prevent memory leaks
    window.electronAPI.removeAllListeners('menu-new');
}); 