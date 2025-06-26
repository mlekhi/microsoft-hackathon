const AZURE_WHISPER_ENDPOINT = 'https://amin-mcci4fqi-swedencentral.cognitiveservices.azure.com';
const AZURE_WHISPER_DEPLOY    = 'whisper';
const AZURE_API_VERSION       = '2024-06-01';
const AZURE_API_KEY           = '';


const apiKey = "";
const endpoint = "https://intern-hackathon-openai.openai.azure.com";
const deployment = "gpt-4o-mini";
const apiVersion = "2024-12-01-preview";

const startBtn = document.getElementById('startRecBtn');
const stopBtn  = document.getElementById('stopRecBtn');
const output   = document.getElementById('whisperResult');
const backBtn  = document.getElementById('backBtn');

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

startBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => e.data.size && chunks.push(e.data);
    recorder.start();

    output.textContent = '🔴 Recording…';
    startBtn.disabled = true;
    stopBtn.disabled  = false;
  } catch (err) {
    console.error(err);
    output.textContent = '❌ Mic access denied.';
  }
};

stopBtn.onclick = () => {
  if (!recorder) return;
  recorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  output.textContent = '⏳ Processing…';

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
        output.textContent = `❌ ${data.error?.message || 'Failed to transcribe'}`;
      } else {
        // output.textContent = data.text || '[No text returned]';
        const response = await askGPT(data.text);
        console.log('GPT response', response);
        // output.textContent = JSON.stringify(response, null, 2);
        showQuizModal(response);
      }
    } catch (err) {
      console.error(err);
      output.textContent = `❌ ${err.message}`;
    }
  };
};

backBtn.onclick = () => {
  window.location.href = 'index.html';
};