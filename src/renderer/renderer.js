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
let meetings = [];

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

function renderMeetings() {
    const list = document.getElementById('meetingsList');
    list.innerHTML = '';
    if (meetings.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem;">No meetings yet.</p>';
        return;
    }
    meetings.forEach((meeting, idx) => {
        const div = document.createElement('div');
        div.className = 'meeting-item';
        div.style = 'margin-bottom: 16px; display: flex; align-items: center; gap: 12px;';
        div.innerHTML = `<a href="#" class="meeting-title" style="color: var(--accent-primary); font-weight: 600; font-size: 1.1rem;">${meeting.title}</a> <span class="meeting-date" style="color: var(--text-secondary); font-size: 0.95rem;">(${meeting.date})</span> <button class="btn delete-btn" data-idx="${idx}" style="margin-left: 8px;">Delete</button>`;
        list.appendChild(div);
    });
    // Attach delete handlers
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            const idx = +btn.getAttribute('data-idx');
            meetings.splice(idx, 1);
            renderMeetings();
        };
    });
}

function showModal(show) {
    document.getElementById('meetingModal').style.display = show ? 'flex' : 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Query elements inside DOMContentLoaded
    const themeBtn = document.getElementById('themeBtn');
    const addMeetingBtn = document.getElementById('addMeetingBtn');
    const cancelMeetingBtn = document.getElementById('cancelMeetingBtn');
    const createMeetingBtn = document.getElementById('createMeetingBtn');

    let isDark = false;
    let meetings = [];

    function toggleTheme() {
        isDark = !isDark;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        themeBtn.textContent = isDark ? '☀️' : '🌙';
    }

    function renderMeetings() {
        const list = document.getElementById('meetingsList');
        list.innerHTML = '';
        if (meetings.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem;">No meetings yet.</p>';
            return;
        }
        meetings.forEach((meeting, idx) => {
            const div = document.createElement('div');
            div.className = 'meeting-item';
            div.innerHTML = `<a href="#" class="meeting-title">${meeting.title}</a> <span class="meeting-date">(${meeting.date})</span> <button class="btn delete-btn" data-idx="${idx}">Delete</button>`;
            list.appendChild(div);
        });
        // Attach delete handlers
        list.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = (e) => {
                const idx = +btn.getAttribute('data-idx');
                meetings.splice(idx, 1);
                renderMeetings();
            };
        });
    }

    function showModal(show) {
        document.getElementById('meetingModal').style.display = show ? 'flex' : 'none';
    }

    renderMeetings();
    themeBtn.onclick = toggleTheme;
    addMeetingBtn.onclick = () => {
        document.getElementById('meetingTitle').value = '';
        document.getElementById('meetingContext').value = '';
        showModal(true);
    };
    cancelMeetingBtn.onclick = () => showModal(false);
    createMeetingBtn.onclick = () => {
        const title = document.getElementById('meetingTitle').value.trim();
        const context = document.getElementById('meetingContext').value.trim();
        if (!title) return alert('Title required');
        const date = new Date().toLocaleString();
        meetings.push({ title, context, date });
        showModal(false);
        renderMeetings();
    };
    // Set initial theme
    document.documentElement.setAttribute('data-theme', 'light');
}); 