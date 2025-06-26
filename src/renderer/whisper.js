const AZURE_WHISPER_ENDPOINT = 'https://amin-mcci4fqi-swedencentral.cognitiveservices.azure.com';
const AZURE_WHISPER_DEPLOY    = 'whisper';
const AZURE_API_VERSION       = '2024-06-01';
const AZURE_API_KEY           = '';


const startBtn = document.getElementById('startRecBtn');
const stopBtn  = document.getElementById('stopRecBtn');
const output   = document.getElementById('whisperResult');
const backBtn  = document.getElementById('backBtn');

console.log(AZURE_WHISPER_ENDPOINT);

let recorder, chunks = [];

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
        output.textContent = data.text || '[No text returned]';
        await askGPT(`Transcribe this audio: ${data.text}`);
        output.textContent += '\n\n💬 GPT response:\n' + data.text;
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