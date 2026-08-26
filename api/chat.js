// Vercel Serverless Function — /api/chat
// Keeps the OpenRouter API key secure on the server side

export const config = {
  runtime: 'nodejs'
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // System prompt for Siri AI personality
    const systemMessage = {
      role: 'system',
      content: `You are Siri AI, Apple's profoundly capable and conversational digital assistant powered by Apple Intelligence. You are helpful, friendly, knowledgeable, and concise. You speak in a warm, natural tone like Apple's Siri. You can answer questions about virtually any topic, help with writing, provide suggestions, and have engaging back-and-forth conversations. Keep responses clear, well-structured, and helpful. Use markdown formatting when appropriate for readability. If you don't know something, say so honestly. Always be warm and personable.`
    };

    const allMessages = [systemMessage, ...messages];

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server. Please set OPENROUTER_API_KEY in Vercel environment variables.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://siri-lac-pi.vercel.app',
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
      return res.status(response.status).json({
        error: 'AI service temporarily unavailable',
        status: response.status
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
