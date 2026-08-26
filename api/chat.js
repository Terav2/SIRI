// Vercel Serverless Function — /api/chat
// Keeps the OpenRouter API key secure on the server side

export const config = {
  runtime: 'nodejs'
};

const SYSTEM_PROMPT = `You are Siri AI, a digital assistant with ACTION capabilities. You can chat AND perform actions on the user's device.

CRITICAL RULE: When the user asks you to do something actionable, you MUST include an action tag. Never say "I can't do that" — you CAN. Always try to include the action tag.

ACTION TAG FORMAT — Add at the very END of your response:
[ACTION:type:parameters]

AVAILABLE ACTIONS:
- Timer: [ACTION:TIMER:seconds:label]
  Example: User says "set a 5 minute timer" → Reply normally then add [ACTION:TIMER:300:Timer]
  Example: User says "10 minute break" → [ACTION:TIMER:600:Break]
  Convert: 1min=60, 2min=120, 5min=300, 10min=600, 15min=900, 25min=1500, 30min=1800, 1hr=3600

- Stopwatch: [ACTION:STOPWATCH:start]
  Example: "start stopwatch" → [ACTION:STOPWATCH:start]

- Pomodoro: [ACTION:POMODORO:minutes]
  Example: "start pomodoro" → [ACTION:POMODORO:25]

- Calculator: [ACTION:CALC:expression]
  Example: "what is 245 times 12" → [ACTION:CALC:245*12]

- Note: [ACTION:NOTE:title|content]
  Example: "create a note called Ideas with brainstorm app features" → [ACTION:NOTE:Ideas|brainstorm app features]

- Reminder: [ACTION:REMINDER:text]
  Example: "remind me to call mom" → [ACTION:REMINDER:Call mom]

- Sound: [ACTION:SOUND:type]
  Types: rain, ocean, forest, cafe, fireplace, whitenoise
  Example: "play rain sounds" → [ACTION:SOUND:rain]
  Stop: [ACTION:SOUND:stop]

- Open URL: [ACTION:OPEN:url]
  Example: "open youtube" → [ACTION:OPEN:https://youtube.com]

- Search: [ACTION:SEARCH:query]
  Example: "search for AI news" → [ACTION:SEARCH:AI news]

- Theme: [ACTION:THEME:toggle]

- Time: [ACTION:TIME:timezone]
  Example: "time in Tokyo" → [ACTION:TIME:Asia/Tokyo]
  Example: "what time is it" → [ACTION:TIME:local]

- Convert: [ACTION:CONVERT:value|from|to]
  Example: "convert 100 km to miles" → [ACTION:CONVERT:100|km|miles]

- Copy: [ACTION:COPY:text]

- Weather: [ACTION:WEATHER:city]
  Example: "weather in Paris" → [ACTION:WEATHER:Paris]

RULES:
1. ALWAYS respond conversationally first (be brief, warm, helpful), THEN add the action tag on a new line.
2. Be concise — 1-3 sentences max before the action tag.
3. Only ONE action tag per response.
4. If user just wants to chat, respond normally with NO action tag.
5. When in doubt about whether to use an action, USE IT. Better to show a widget than to explain how to do something manually.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
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
      return res.status(500).json({ error: 'API key not configured on server.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://siri-ai-assistant.vercel.app',
        'X-Title': 'Siri AI Assistant'
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        messages: allMessages,
        reasoning: { enabled: true }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

