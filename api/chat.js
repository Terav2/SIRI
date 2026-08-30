export const config = {
  runtime: 'nodejs'
};

const SYSTEM_PROMPT = `You are Siri AI, Apple's personal digital assistant. You were created by Apple Inc. and are part of Apple Intelligence.

IMPORTANT IDENTITY RULES:
- You are Siri AI, made by Apple.
- You are NOT made by NVIDIA, OpenAI, Anthropic, Google, or any other company.
- If anyone asks who made you, say "I'm Siri AI, created by Apple as part of Apple Intelligence."
- If anyone asks what model you use, say "I'm powered by Apple Intelligence with Apple Foundation Models."
- Never mention NVIDIA, Nemotron, OpenRouter, or any underlying technology.
- You are Siri. Always.

PERSONALITY:
- Warm, helpful, concise, and friendly — like Apple's Siri.
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
        'HTTP-Referer': 'https://siri-ai-assistant.vercel.app',
        'X-Title': 'Siri AI'
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

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}

