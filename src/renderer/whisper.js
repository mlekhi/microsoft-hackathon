const AZURE_WHISPER_ENDPOINT = 'https://amin-mcci4fqi-swedencentral.cognitiveservices.azure.com';
const AZURE_WHISPER_DEPLOY    = 'whisper';
const AZURE_API_VERSION       = '2024-06-01';
const AZURE_API_KEY           = '';

const apiKey = '';
const endpoint = "https://intern-hackathon-openai.openai.azure.com";
const deployment = "gpt-4o-mini";
const apiVersion = "2024-12-01-preview";

const startBtn = document.getElementById('startRecBtn');
const stopBtn  = document.getElementById('stopRecBtn');
const output   = document.getElementById('whisperResult');
const backBtn  = document.getElementById('backBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');

// Status management functions
function showStatus(icon, text, className = '') {
  if (statusIndicator && statusIcon && statusText) {
    statusIcon.textContent = icon;
    statusText.textContent = text;
    statusIndicator.className = `status-indicator ${className}`;
    statusIndicator.style.display = 'flex';
  }
}

function hideStatus() {
  if (statusIndicator) {
    statusIndicator.style.display = 'none';
  }
}

// Add circular icon element
let circularIcon = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let initialMousePos = { x: 0, y: 0 };
let currentPosition = { x: 0, y: 0 };

console.log(AZURE_WHISPER_ENDPOINT);

let recorder, chunks = [];

async function askGPT(transcript) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const prompt = `
From the following meeting discussion, generate a multiple-choice quiz question that tests whether someone was paying attention.

Respond **only** in this exact JSON format:
{
  "question": "string",
  "choices": {
    "A": "string",
    "B": "string",
    "C": "string",
    "D": "string"
  },
  "answer": "A" | "B" | "C" | "D",
  "explanation": "string"
}

MEETING SNIPPET:
"""${transcript}"""
`.trim();

  const payload = {
    messages: [
      { role: 'system', content: 'You are an AI that creates factual multiple choice quizzes from transcripts.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 500
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Unknown error from Azure OpenAI');
  }

  const data = await res.json();
  const raw = data.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    throw new Error('Failed to parse GPT response as JSON:\n' + raw);
  }
}

function getWhisperUrl() {
  // now uses the correct constant
  const url = `${AZURE_WHISPER_ENDPOINT}/openai/deployments/${AZURE_WHISPER_DEPLOY}/audio/translations?api-version=${AZURE_API_VERSION}`;
  console.log('Whisper URL:', url);
  return url;
}

// Add window control functions
function minimizeWindow() {
  if (window.electronAPI && window.electronAPI.minimizeWindow) {
    window.electronAPI.minimizeWindow();
    // Create overlay window for the circular icon
    if (window.electronAPI.createOverlayWindow) {
      window.electronAPI.createOverlayWindow();
    }
  } else {
    // Fallback for web version - hide the main content but keep body visible
    const mainContent = document.querySelector('main') || document.querySelector('.container') || document.querySelector('#app');
    if (mainContent) {
      mainContent.style.display = 'none';
    } else {
      // If no main container found, hide all direct children of body except our circular icon
      Array.from(document.body.children).forEach(child => {
        if (child.id !== 'recordingIcon') {
          child.style.display = 'none';
        }
      });
    }
    showCircularIcon();
  }
}

function restoreWindow() {
  if (window.electronAPI && window.electronAPI.restoreWindow) {
    window.electronAPI.restoreWindow();
    // Close overlay window
    if (window.electronAPI.closeOverlayWindow) {
      window.electronAPI.closeOverlayWindow();
    }
  } else {
    // Fallback for web version - show the main content
    const mainContent = document.querySelector('main') || document.querySelector('.container') || document.querySelector('#app');
    if (mainContent) {
      mainContent.style.display = 'block';
    } else {
      // Restore all hidden children
      Array.from(document.body.children).forEach(child => {
        if (child.id !== 'recordingIcon') {
          child.style.display = '';
        }
      });
    }
    hideCircularIcon();
  }
}

function showCircularIcon() {
  if (circularIcon) return;
  
  circularIcon = document.createElement('div');
  circularIcon.id = 'recordingIcon';
  circularIcon.innerHTML = '🔴';
  circularIcon.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: #ff4444;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: pulse 2s infinite;
    user-select: none;
  `;
  
  // Initialize position tracking
  const rect = { left: window.innerWidth - 80, top: 20 }; // Calculate initial position
  currentPosition.x = rect.left;
  currentPosition.y = rect.top;
  
  // Add CSS animation
  if (!document.getElementById('pulseAnimation')) {
    const style = document.createElement('style');
    style.id = 'pulseAnimation';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add drag functionality back
  circularIcon.onmousedown = (e) => {
    e.preventDefault();
    isDragging = true;
    initialMousePos.x = e.clientX;
    initialMousePos.y = e.clientY;
    
    const rect = circularIcon.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // Pause animation while dragging and switch to transform positioning
    circularIcon.style.animation = 'none';
    circularIcon.style.cursor = 'grabbing';
    circularIcon.style.left = 'auto';
    circularIcon.style.top = 'auto';
    circularIcon.style.right = 'auto';
    circularIcon.style.transform = `translate(${currentPosition.x}px, ${currentPosition.y}px)`;
  };
  
  document.onmousemove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Update current position
    currentPosition.x = x;
    currentPosition.y = y;
    
    // Use transform positioning
    circularIcon.style.transform = `translate(${x}px, ${y}px)`;
  };
  
  document.onmouseup = (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    // Resume animation with transform-compatible animation
    circularIcon.style.cursor = 'pointer';
    
    // Update the pulse animation to work with transform positioning
    const existingStyle = document.getElementById('pulseAnimation');
    if (existingStyle) {
      existingStyle.textContent = `
        @keyframes pulse {
          0% { transform: translate(${currentPosition.x}px, ${currentPosition.y}px) scale(1); }
          50% { transform: translate(${currentPosition.x}px, ${currentPosition.y}px) scale(1.1); }
          100% { transform: translate(${currentPosition.x}px, ${currentPosition.y}px) scale(1); }
        }
      `;
    }
    circularIcon.style.animation = 'pulse 2s infinite';
    
    // Check if it was a click (minimal movement from initial position)
    const deltaX = Math.abs(e.clientX - initialMousePos.x);
    const deltaY = Math.abs(e.clientY - initialMousePos.y);
    
    if (deltaX < 5 && deltaY < 5) {
      restoreWindow();
    }
  };
  
  document.body.appendChild(circularIcon);
}

function hideCircularIcon() {
  if (circularIcon) {
    circularIcon.remove();
    circularIcon = null;
  }
}

// Function to reset UI state after quiz completion
function resetUIState() {
  output.textContent = '';
  hideStatus();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  
  // Clear any chunks
  chunks = [];
  
  // Stop any ongoing recording if somehow still active
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
  }
  
  // Make sure window is restored
  restoreWindow();
}

startBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.start();

    showStatus('🔴', 'Recording...', 'recording');
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    
    // Minimize window after starting recording
    setTimeout(() => {
      minimizeWindow();
    }, 1000); // Give user 1 second to see the recording started message
    
  } catch (err) {
    console.error(err);
    showStatus('❌', 'Microphone access denied', 'error');
  }
};

stopBtn.onclick = () => {
  if (!recorder) return;
  recorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  showStatus('⏳', 'Processing transcription...', 'processing');
  
  // Hide circular icon when stopping
  hideCircularIcon();

  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    const form = new FormData();
    form.append('file', blob, 'recording.webm');
    form.append('model', AZURE_WHISPER_DEPLOY);

    try {
      const res = await fetch(getWhisperUrl(), {
        method: 'POST',
        headers: { 'api-key': AZURE_API_KEY },
        body: form
      });
      const data = await res.json();
      console.log('Whisper response', data);

      if (!res.ok) {
        showStatus('❌', data.error?.message || 'Failed to transcribe', 'error');
      } else {
        showStatus('🤖', 'Generating quiz question...', 'processing');
        
        const response = await askGPT(data.text);
        console.log('GPT response', response);
        
        // Clear the processing message before showing quiz
        hideStatus();
        
        // Show quiz modal with callback to reset UI when closed
        showQuizModal(response, resetUIState);
      }
    } catch (err) {
      console.error(err);
      showStatus('❌', err.message, 'error');
    }
  };
};

backBtn.onclick = () => {
  window.location.href = 'index.html';
};