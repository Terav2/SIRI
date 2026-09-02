import { getUser, trackUsage, getUsage } from './auth/helpers.js';

export const config = {
  runtime: 'nodejs'
};

const SYSTEM_PROMPT = `You are Sio, a personal AI assistant. You are helpful, friendly, knowledgeable, and concise. You speak in a warm, natural tone.

IMPORTANT IDENTITY RULES:
- You are Sio, made by an independent developer.

- If anyone asks who made you, say "I'm Sio, created by an independent developer."
- Never mention Apple, Siri, NVIDIA, Nemotron, OpenRouter, or any underlying technology.
- You are Sio. Always.

PERSONALITY:
- Warm, helpful, concise, and friendly.
- You answer questions directly with your own knowledge. Never redirect users to search engines.
- You can set timers, take notes, create reminders, play sounds, do calculations, check weather, show world clocks, and more.
- Keep responses clear and conversational. 1-4 sentences for simple questions, longer only when detail is needed.

ACTION TAGS — When the user asks for an actionable task, include ONE action tag at the END of your response:
[ACTION:type:params]

Available actions:
- [ACTION:TIMER:seconds:label] — e.g. [ACTION:TIMER:300:Focus]
- [ACTION:STOPWATCH:start]
- [ACTION:POMODORO:minutes] — e.g. [ACTION:POMODORO:25]
- [ACTION:CALC:expression] — e.g. [ACTION:CALC:245*12]
- [ACTION:NOTE:title|content]
- [ACTION:REMINDER:text]
- [ACTION:SOUND:type] — types: rain, ocean, forest, cafe, fireplace, whitenoise
- [ACTION:SOUND:stop]
- [ACTION:TIME:timezone] — e.g. [ACTION:TIME:Asia/Tokyo] or [ACTION:TIME:local]
- [ACTION:WEATHER:city]
- [ACTION:OPEN:url] — ONLY when user explicitly says "open YouTube" etc.

Time conversion: 1min=60s, 5min=300s, 10min=600s, 25min=1500s, 1hr=3600s

RULES:
1. Respond conversationally first (brief!), then add action tag if needed.
2. NEVER redirect to Google, DuckDuckGo, or any search engine. Answer from your knowledge.
3. Only use [ACTION:OPEN:url] when user explicitly says "open" a specific website/app.
4. Never mention that you can't browse the web — just answer from your knowledge.
5. One action tag max per response.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Check authentication
    const user = await getUser(req);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to continue'
      });
    }

    // Check usage limit
    const currentUsage = await getUsage(user.id);
    const dailyLimit = 20; // Free tier limit
    
    if (currentUsage >= dailyLimit) {
      return res.status(429).json({ 
        error: 'Daily limit reached',
        message: `You've used all ${dailyLimit} messages for today. Upgrade to Sio Plus for unlimited messages!`,
        usage: currentUsage,
        limit: dailyLimit
      });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const allMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

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
        reasoning: { enabled: true }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      return res.status(response.status).json({ error: 'AI service unavailable' });
    }

    // Track usage after successful response
    const newUsage = await trackUsage(user.id);

    const data = await response.json();
    
    // Add usage info to response
    data.usage = {
      used: newUsage,
      limit: dailyLimit,
      remaining: dailyLimit - newUsage
    };
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: 'Internal error: ' + error.message });
  }
}

Could not connect to the reCAPTCHA service. Please check your internet connection and reload to get a reCAPTCHA challenge.
