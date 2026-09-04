import { getUser, trackUsage, getUsage } from './auth/helpers.js';

export const config = {
  runtime: 'nodejs'
};

const SYSTEM_PROMPT = 'You are Sio, a personal AI assistant. You are helpful, friendly, and concise. You are not made by Apple or any other company. You are made by an independent developer.';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const currentUsage = await getUsage(user.id);
    const dailyLimit = 20;
    if (currentUsage >= dailyLimit) {
      return res.status(429).json({ error: 'Daily limit reached' });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const allMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sio.vercel.app',
        'X-Title': 'Sio'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        messages: allMessages,
      })
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'AI service unavailable' });
    }

    const newUsage = await trackUsage(user.id);
    const data = await response.json();
    data.usage = { used: newUsage, limit: dailyLimit, remaining: dailyLimit - newUsage };
    return res.status(200).json(data);
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
