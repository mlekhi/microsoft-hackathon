// src/renderer/chat.js

const apiKey = "";
const endpoint = "https://intern-hackathon-openai.openai.azure.com";
const deployment = "gpt-4o-mini";
const apiVersion = "2024-12-01-preview";

async function askGPT(prompt) {
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const payload = {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
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
  return data.choices[0].message.content;
}

// TEMP test runner
async function main() {
  try {
    const result = await askGPT('What are 3 interesting ideas for a hackathon project?');
    console.log('\n💬 GPT says:\n', result);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
