// src/renderer/renderer.js

// UI Elements
const themeBtn = document.getElementById('themeBtn');
const addMeetingBtn = document.getElementById('addMeetingBtn');
const cancelMeetingBtn = document.getElementById('cancelMeetingBtn');
const createMeetingBtn = document.getElementById('createMeetingBtn');
const startRecBtn = document.getElementById('startRecBtn');
const stopRecBtn  = document.getElementById('stopRecBtn');
const transcriptDisplay = document.getElementById('transcriptDisplay');

let isDark = false;
let meetings = [];
let mediaRecorder, audioChunks = [];

// Toggle theme
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeBtn.textContent = isDark ? '☀️' : '🌙';
}

// Show/hide modal
function showModal(show) {
  document.getElementById('meetingModal').style.display = show ? 'flex' : 'none';
}

// Render meetings list
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
    div.style = 'margin-bottom:16px; display:flex; align-items:center; gap:12px;';
    div.innerHTML = `
      <a href="#" class="meeting-title" style="color:var(--accent-primary); font-weight:600; font-size:1.1rem;">
        ${meeting.title}
      </a>
      <span class="meeting-date" style="color:var(--text-secondary); font-size:0.95rem;">
        (${meeting.date})
      </span>
      <button class="btn delete-btn" data-idx="${idx}" style="margin-left:8px;">Delete</button>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.getAttribute('data-idx');
      meetings.splice(idx, 1);
      renderMeetings();
    };
  });
}

// Setup basic Recording UI (placeholder)
function setupRecordingUI() {
  startRecBtn.onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size) audioChunks.push(e.data); };
    mediaRecorder.start();
    transcriptDisplay.textContent = 'Recording...';
    startRecBtn.disabled = true;
    stopRecBtn.disabled = false;
  };

  stopRecBtn.onclick = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      startRecBtn.disabled = false;
      stopRecBtn.disabled = true;
      transcriptDisplay.textContent = 'Transcribe via Whisper page.';
    }
  };
}

// Wire up events
document.addEventListener('DOMContentLoaded', () => {
  themeBtn.onclick = toggleTheme;
  document.documentElement.setAttribute('data-theme', 'light');

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

    let title = titleInput, date = 'TBD';
    const atMatch = titleInput.match(/@\s*([^@]+)/);
    if (atMatch) {
      const t = atMatch[1].trim();
      let d = new Date(t);
      if (isNaN(d)) d = new Date(new Date().toDateString() + ' ' + t);
      date = !isNaN(d) ? d.toLocaleString() : t;
      title = titleInput.replace(/@\s*[^@]+/, '').trim();
    }

    meetings.push({ title, context, date });
    showModal(false);
    renderMeetings();
  };

  renderMeetings();
  setupRecordingUI();
});
