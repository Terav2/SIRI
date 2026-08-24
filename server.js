const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================
// API: Chat endpoint (local dev proxy to OpenRouter)
// ============================
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemMessage = {
      role: 'system',
      content: `You are Siri AI, Apple's profoundly capable and conversational digital assistant powered by Apple Intelligence. You are helpful, friendly, knowledgeable, and concise. You speak in a warm, natural tone like Apple's Siri. You can answer questions about virtually any topic, help with writing, provide suggestions, and have engaging back-and-forth conversations. Keep responses clear, well-structured, and helpful. Use markdown formatting when appropriate for readability. If you don't know something, say so honestly. Always be warm and personable.`
    };

    const allMessages = [systemMessage, ...messages];

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured. Set OPENROUTER_API_KEY in .env file.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:' + PORT,
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
      console.error('OpenRouter API error:', errorText);
      return res.status(response.status).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Chat API error:', error.message);
    res.status(500).json({ error: 'Failed to connect to AI service. Please try again.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Siri AI Assistant', 
    version: '1.0.0',
    mode: 'local-development'
  });
});

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✨ ═══════════════════════════════════════════ ✨`);
  console.log(`   Siri AI Assistant — iOS 27 Inspired`);
  console.log(`✨ ═══════════════════════════════════════════ ✨`);
  console.log(`   🌐 Server:    http://localhost:${PORT}`);
  console.log(`   📡 API:       http://localhost:${PORT}/api/chat`);
  console.log(`   🤖 AI Model:  NVIDIA Nemotron (via OpenRouter)`);
  console.log(`   🚀 Deploy:    vercel --prod`);
  console.log(`✨ ═══════════════════════════════════════════ ✨\n`);
});
