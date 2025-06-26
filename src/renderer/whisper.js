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

// Minimize button element
let minimizeButton = null;

function showMinimizeButton() {
  if (minimizeButton || !isRecording) return;
  
  minimizeButton = document.createElement('div');
  minimizeButton.id = 'minimizeBtn';
  minimizeButton.innerHTML = '➖';
  minimizeButton.title = 'Minimize Window';
  minimizeButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    color: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    z-index: 9999;
    box-shadow: var(--shadow-lg);
    transition: var(--transition);
    user-select: none;
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;
  
  // Add hover effects
  minimizeButton.onmouseenter = () => {
    minimizeButton.style.transform = 'scale(1.05)';
    minimizeButton.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
  };
  
  minimizeButton.onmouseleave = () => {
    minimizeButton.style.transform = 'scale(1)';
    minimizeButton.style.boxShadow = 'var(--shadow-lg)';
  };
  
  minimizeButton.onclick = () => {
    console.log('Minimize button clicked');
    hideMinimizeButton();
    
    // Ensure the circular icon will appear after minimizing
    setTimeout(() => {
      console.log('Delayed check for circular icon after minimize button click');
      if (isRecording && !circularIcon) {
        console.log('Circular icon missing, creating it now');
        showCircularIcon();
      }
    }, 500);
    
    minimizeWindow();
  };
  
  document.body.appendChild(minimizeButton);
  console.log('Minimize button shown');
}

function hideMinimizeButton() {
  if (minimizeButton) {
    minimizeButton.remove();
    minimizeButton = null;
    console.log('Minimize button hidden');
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

// Quiz timer variables
let quizTimer = null;
let isRecording = false;
let recordingTranscripts = [];
let usedTranscriptIndices = []; // Track which transcripts have been used for quizzes
let settings = null;
let continuousRecorder = null;
let backgroundChunks = [];

// Load settings from the main page
function loadQuizSettings() {
  // Try to get settings from sessionStorage first (passed from index.html)
  const sessionSettings = sessionStorage.getItem('meetMindrSettings');
  const localSettings = localStorage.getItem('meetMindrSettings');
  
  if (sessionSettings) {
    try {
      settings = JSON.parse(sessionSettings);
    } catch (e) {
      console.warn('Failed to parse session settings');
    }
  } else if (localSettings) {
    try {
      settings = JSON.parse(localSettings);
    } catch (e) {
      console.warn('Failed to parse local settings');
    }
  }
  
  // Default settings if none found
  if (!settings) {
    settings = {
      quizFrequencyType: 'fixed',
      fixedInterval: 5,
      randomMinInterval: 3,
      randomMaxInterval: 10
    };
  }
  
  console.log('Loaded quiz settings:', settings);
}

// Get next quiz interval based on settings
function getNextQuizInterval() {
  if (!settings) loadQuizSettings();
  
  let intervalMinutes;
  if (settings.quizFrequencyType === 'random') {
    const min = settings.randomMinInterval || 3;
    const max = settings.randomMaxInterval || 10;
    // Generate random interval between min and max (inclusive)
    intervalMinutes = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`Random quiz interval: ${intervalMinutes} minutes (range: ${min}-${max})`);
  } else {
    intervalMinutes = settings.fixedInterval || 5;
    console.log(`Fixed quiz interval: ${intervalMinutes} minutes`);
  }
  
  return intervalMinutes * 60 * 1000; // Convert to milliseconds
}

// Schedule next quiz during recording
function scheduleNextQuiz() {
  if (!isRecording) return;
  
  const interval = getNextQuizInterval();
  console.log(`Next quiz scheduled in ${interval / 1000 / 60} minutes`);
  
  quizTimer = setTimeout(() => {
    if (isRecording) {
      triggerQuizDuringRecording();
    }
  }, interval);
}

// Clear quiz timer
function clearQuizTimer() {
  if (quizTimer) {
    clearTimeout(quizTimer);
    quizTimer = null;
    console.log('Quiz timer cleared');
  }
}

// Start background audio capture for quiz generation
async function startBackgroundRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    continuousRecorder = new MediaRecorder(stream);
    backgroundChunks = [];
    
    // Set up data handler for continuous chunks
    continuousRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0 && isRecording) {
        console.log('Processing background audio chunk for quiz content');
        // Process this chunk for potential quiz content
        const blob = new Blob([e.data], { type: 'audio/webm' });
        await processAudioChunkForQuiz(blob);
      }
    };
    
    // Start recording with 30-second chunks
    continuousRecorder.start(30000); // 30 second chunks
    console.log('Background recording started for quiz generation');
    
  } catch (err) {
    console.error('Failed to start background recording:', err);
  }
}

// Stop background recording
function stopBackgroundRecording() {
  if (continuousRecorder && continuousRecorder.state !== 'inactive') {
    continuousRecorder.stop();
    continuousRecorder = null;
    console.log('Background recording stopped');
  }
}

// Process audio chunk for quiz content
async function processAudioChunkForQuiz(audioBlob) {
  try {
    const form = new FormData();
    form.append('file', audioBlob, 'chunk.webm');
    form.append('model', AZURE_WHISPER_DEPLOY);

    const res = await fetch(getWhisperUrl(), {
      method: 'POST',
      headers: { 'api-key': AZURE_API_KEY },
      body: form
    });
    
    const data = await res.json();
    
    if (res.ok && data.text && data.text.trim().length > 20) {
      recordTranscriptSnippet(data.text);
      console.log('Background transcript captured:', data.text);
    }
  } catch (error) {
    console.warn('Failed to process background audio chunk:', error);
  }
}

// Get unused transcript content for quiz generation
function getUnusedTranscriptContent() {
  console.log('Getting unused transcript content');
  console.log('Total transcripts:', recordingTranscripts.length);
  console.log('Used transcript indices:', usedTranscriptIndices);
  
  // Find indices that haven't been used yet
  let unusedIndices = [];
  for (let i = 0; i < recordingTranscripts.length; i++) {
    if (!usedTranscriptIndices.includes(i)) {
      unusedIndices.push(i);
    }
  }
  
  console.log('Unused indices:', unusedIndices);
  
  if (unusedIndices.length === 0) {
    // If all transcripts have been used, reset and use newer content
    console.log('All transcripts used, resetting and using newest content');
    usedTranscriptIndices = [];
    
    // Use the most recent transcript(s)
    if (recordingTranscripts.length >= 2) {
      const startIndex = recordingTranscripts.length - 2;
      usedTranscriptIndices.push(startIndex, startIndex + 1);
      return recordingTranscripts.slice(-2).join(' ');
    } else if (recordingTranscripts.length === 1) {
      usedTranscriptIndices.push(0);
      return recordingTranscripts[0];
    }
    return null;
  }
  
  // Use the oldest unused transcript(s) for better chronological order
  let transcriptContent;
  if (unusedIndices.length >= 2) {
    // Use 2 consecutive unused transcripts for more context
    const startIndex = unusedIndices[0];
    const endIndex = Math.min(startIndex + 1, unusedIndices[unusedIndices.length - 1]);
    
    usedTranscriptIndices.push(startIndex);
    if (endIndex !== startIndex) {
      usedTranscriptIndices.push(endIndex);
      transcriptContent = recordingTranscripts[startIndex] + ' ' + recordingTranscripts[endIndex];
    } else {
      transcriptContent = recordingTranscripts[startIndex];
    }
  } else {
    // Use single unused transcript
    const index = unusedIndices[0];
    usedTranscriptIndices.push(index);
    transcriptContent = recordingTranscripts[index];
  }
  
  console.log('Selected transcript content:', transcriptContent);
  console.log('Updated used indices:', usedTranscriptIndices);
  
  return transcriptContent;
}

// Trigger a quiz during recording
async function triggerQuizDuringRecording() {
  if (!isRecording) {
    console.log('Recording stopped, not triggering quiz');
    return;
  }
  
  if (recordingTranscripts.length === 0) {
    console.log('No transcripts available for quiz, rescheduling...');
    scheduleNextQuiz();
    return;
  }
  
  try {
    // Find unused transcript content for the quiz
    let transcriptForQuiz = getUnusedTranscriptContent();
    
    if (!transcriptForQuiz) {
      console.log('No unused transcript content available, rescheduling...');
      scheduleNextQuiz();
      return;
    }
    
    console.log('Triggering quiz with transcript:', transcriptForQuiz);
    showStatus('🤖', 'Generating quiz question...', 'processing');
    
    const quizData = await askGPT(transcriptForQuiz);
    console.log('Generated quiz:', quizData);
    
    // Clear the processing status
    hideStatus();
    
    // Show quiz modal with callback to schedule next quiz
    showQuizModal(quizData, () => {
      console.log('Quiz completed, scheduling next quiz');
      if (isRecording) {
        scheduleNextQuiz();
      }
    });
    
  } catch (error) {
    console.error('Failed to generate quiz:', error);
    showStatus('❌', 'Failed to generate quiz', 'error');
    setTimeout(() => hideStatus(), 3000);
    
    // Schedule next quiz anyway if still recording
    if (isRecording) {
      scheduleNextQuiz();
    }
  }
}

// Record transcript snippets during recording
function recordTranscriptSnippet(transcript) {
  if (!transcript || transcript.trim().length === 0) return;
  
  recordingTranscripts.push(transcript);
  
  // Keep only the last 5 transcripts to avoid memory issues
  if (recordingTranscripts.length > 5) {
    recordingTranscripts.shift();
    // Adjust used indices when removing the oldest transcript
    usedTranscriptIndices = usedTranscriptIndices
      .map(index => index - 1)
      .filter(index => index >= 0);
  }
  
  console.log('Recorded transcript snippet:', transcript);
  console.log('Total transcript snippets:', recordingTranscripts.length);
  console.log('Used transcript indices after recording:', usedTranscriptIndices);
}

async function askGPT(transcript) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const prompt = `
From the following meeting discussion, generate a unique multiple-choice quiz question that tests whether someone was paying attention to the specific content discussed.

Focus on:
- Specific details, names, numbers, or decisions mentioned
- Key topics or subjects discussed in this particular segment
- Important points or conclusions reached
- Create questions that are clearly tied to this specific content

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
      { role: 'system', content: 'You are an AI that creates factual, specific multiple choice quizzes from meeting transcripts. Each question should be unique and tied to the specific content provided. Avoid generic questions.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7, // Slightly higher temperature for more variety
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
  console.log('minimizeWindow called');
  
  // Hide the minimize button when minimizing
  hideMinimizeButton();
  
  if (window.electronAPI && window.electronAPI.minimizeWindow) {
    window.electronAPI.minimizeWindow();
    // Create overlay window for the circular icon
    if (window.electronAPI.createOverlayWindow) {
      window.electronAPI.createOverlayWindow();
    }
    // Show the circular icon with a small delay to ensure proper display
    setTimeout(() => {
      console.log('Showing circular icon after minimize');
      showCircularIcon();
    }, 100);
  } else {
    // Fallback for web version - maximize window transparently and hide all content
    
    // First, maximize the window to fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
    
    // Make background completely transparent
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    // Hide all direct children of body except our circular icon
    Array.from(document.body.children).forEach(child => {
      if (child.id !== 'recordingIcon') {
        child.style.display = 'none';
      }
    });
    
    showCircularIcon();
  }
}

function restoreWindow() {
  console.log('restoreWindow called'); // Debug log
  
  if (window.electronAPI && window.electronAPI.restoreWindow) {
    window.electronAPI.restoreWindow();
    // Close overlay window
    if (window.electronAPI.closeOverlayWindow) {
      window.electronAPI.closeOverlayWindow();
    }
    // Hide the circular icon when using Electron
    hideCircularIcon();
  } else {
    console.log('Using web fallback for window restoration'); // Debug log
    
    // Fallback for web version - exit fullscreen, restore background and show content
    
    // Hide the circular icon first
    hideCircularIcon();
    
    // Exit fullscreen mode
    let exitFullscreenPromise = null;
    if (document.exitFullscreen) {
      console.log('Exiting fullscreen with document.exitFullscreen'); // Debug log
      exitFullscreenPromise = document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      console.log('Exiting fullscreen with webkitExitFullscreen'); // Debug log
      exitFullscreenPromise = document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      console.log('Exiting fullscreen with msExitFullscreen'); // Debug log
      exitFullscreenPromise = document.msExitFullscreen();
    }
    
    // Wait for fullscreen exit to complete, then restore content
    const restoreContent = () => {
      console.log('Restoring content...'); // Debug log
      
      // Restore original background
      document.body.style.background = '';
      document.documentElement.style.background = '';
      
      // Restore all hidden children
      Array.from(document.body.children).forEach(child => {
        if (child.id !== 'recordingIcon') {
          child.style.display = '';
        }
      });
      
      // Ensure the window is visible and focused
      window.focus();
      console.log('Content restored'); // Debug log
    };
    
    // Use promise if available, otherwise use timeout
    if (exitFullscreenPromise && exitFullscreenPromise.then) {
      exitFullscreenPromise.then(restoreContent).catch((error) => {
        console.log('Fullscreen exit promise failed:', error); // Debug log
        // Fallback if promise fails
        setTimeout(restoreContent, 100);
      });
    } else {
      // Use timeout for browsers that don't return promises
      console.log('Using timeout fallback for content restoration'); // Debug log
      setTimeout(restoreContent, 100);
    }
  }
  
  // Show minimize button if recording is active
  if (isRecording) {
    showMinimizeButton();
  }
}

function showCircularIcon() {
  console.log('showCircularIcon called, current circularIcon:', circularIcon);
  
  if (circularIcon) {
    console.log('Circular icon already exists, not creating new one');
    return;
  }
  
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
  
  // Add click event as backup
  circularIcon.onclick = (e) => {
    // Only restore if we haven't moved much (not a drag)
    const deltaX = Math.abs(e.clientX - initialMousePos.x);
    const deltaY = Math.abs(e.clientY - initialMousePos.y);
    
    if (deltaX < 10 && deltaY < 10) {
      console.log('Click event detected, restoring window...'); // Debug log
      restoreWindow();
    }
  };
  
  document.onmousemove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    let x = e.clientX - dragOffset.x;
    let y = e.clientY - dragOffset.y;
    
    // Constrain to screen bounds with padding
    const padding = 10;
    const iconSize = 60;
    x = Math.max(padding, Math.min(window.innerWidth - iconSize - padding, x));
    y = Math.max(padding, Math.min(window.innerHeight - iconSize - padding, y));
    
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
    
    console.log('Mouse movement delta:', deltaX, deltaY); // Debug log
    
    if (deltaX < 5 && deltaY < 5) {
      console.log('Click detected, restoring window...'); // Debug log
      restoreWindow();
    }
  };
  
  document.body.appendChild(circularIcon);
}

function hideCircularIcon() {
  console.log('hideCircularIcon called, current circularIcon:', circularIcon);
  
  if (circularIcon) {
    circularIcon.remove();
    circularIcon = null;
    console.log('Circular icon removed');
  }
}

// Function to reset UI state after quiz completion
function resetUIState() {
  output.textContent = '';
  hideStatus();
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  
  // Clear any chunks
  chunks = [];
  
  // Stop any ongoing recording if somehow still active
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
  }
  
  // Clean up quiz system
  isRecording = false;
  clearQuizTimer();
  stopBackgroundRecording();
  recordingTranscripts = [];
  usedTranscriptIndices = []; // Reset used transcript tracking
  
  // Hide UI elements
  hideMinimizeButton();
  hideCircularIcon();
  
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
    
    // Start quiz timing system
    isRecording = true;
    recordingTranscripts = [];
    usedTranscriptIndices = []; // Reset used transcript tracking
    loadQuizSettings();
    
    // Start background recording for quiz generation
    await startBackgroundRecording();
    
    // Schedule the first quiz
    scheduleNextQuiz();
    
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
  
  // Stop quiz timing system
  isRecording = false;
  clearQuizTimer();
  stopBackgroundRecording();
  
  // Hide UI elements
  hideCircularIcon();
  hideMinimizeButton();

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
        // Store transcript for quiz generation
        if (data.text && data.text.trim()) {
          recordTranscriptSnippet(data.text);
        }
        
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