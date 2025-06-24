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
let mediaRecorder;
let audioChunks = [];

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

// Function to get mic audio
async function getMicAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Mic audio stream:', stream);
        // You can now use this stream for recording, processing, etc.
        // For example, attach to an audio element:
        // const audio = new Audio();
        // audio.srcObject = stream;
        // audio.play();
    } catch (err) {
        console.error('Error accessing mic:', err);
        alert('Could not access microphone.');
    }
}

async function sendAudioToWhisper(audioBlob) {
    const apiKey = 'YOUR_OPENAI_API_KEY'; // <-- Replace with your OpenAI API key
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    });

    const data = await response.json();
    return data.text;
}

function setupRecordingUI() {
    const startBtn = document.getElementById('startRecBtn');
    const stopBtn = document.getElementById('stopRecBtn');
    const transcriptDisplay = document.getElementById('transcriptDisplay');

    startBtn.onclick = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            transcriptDisplay.textContent = 'Transcribing...';
            try {
                const transcript = await sendAudioToWhisper(audioBlob);
                transcriptDisplay.textContent = transcript;
            } catch (err) {
                transcriptDisplay.textContent = 'Transcription failed.';
            }
        };
        mediaRecorder.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
    };

    stopBtn.onclick = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    };
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
        const titleInput = document.getElementById('meetingTitle').value.trim();
        const context = document.getElementById('meetingContext').value.trim();
        if (!titleInput) return alert('Title required');
        // Parse @ <time> from title
        let title = titleInput;
        let date = '';
        const atMatch = titleInput.match(/@\s*([^@]+)/);
        if (atMatch) {
            const timeStr = atMatch[1].trim();
            // Try parsing as a full date/time first
            let parsed = new Date(timeStr);
            if (isNaN(parsed.getTime())) {
                // Try appending to today if only time is given
                const today = new Date();
                parsed = new Date(today.toDateString() + ' ' + timeStr);
            }
            if (!isNaN(parsed.getTime())) {
                date = parsed.toLocaleString();
            } else {
                date = timeStr; // fallback: just show what user typed
            }
            title = titleInput.replace(/@\s*[^@]+/, '').trim();
        } else {
            date = 'TBD';
        }
        meetings.push({ title, context, date });
        showModal(false);
        renderMeetings();
    };
    // Set initial theme
    document.documentElement.setAttribute('data-theme', 'light');
    getMicAudio();
    setupRecordingUI();
}); 