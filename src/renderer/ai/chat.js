// src/renderer/chat.js
import { config } from 'dotenv';
config();

import { AzureOpenAI } from 'openai';

const apiKey = process.env.AZURE_OPENAI_API_KEY;
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion });

export async function askGPT(prompt) {
  const response = await client.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ],
    model: deployment,
    max_tokens: 1000,
    temperature: 0.7
  });

  return response.choices[0].message.content;
}

// TEMP test runner
async function main() {
  try {
    const result = await askGPT('What are 3 interesting ideas for a hackathon project?');
    console.log('\n💬 GPT says:\n', result);
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

if (process.env.RUN_CHAT_MAIN === 'true') {
  main();
}