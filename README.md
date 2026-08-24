# Siri AI — Digital Assistant

An AI-powered digital assistant inspired by **Apple's Siri AI from iOS 27** (announced at WWDC26). Built with HTML, CSS, JavaScript, and Node.js, using the NVIDIA Nemotron model via OpenRouter.

![Siri AI Assistant](https://img.shields.io/badge/Siri%20AI-iOS%2027%20Inspired-blueviolet)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **🧠 Conversational AI** — Natural back-and-forth conversations powered by NVIDIA Nemotron
- **🎨 Liquid Glass Design** — Beautiful glassmorphism UI inspired by iOS 27's Siri AI
- **🎤 Voice Input** — Speak to Siri using Web Speech API (Chrome/Edge)
- **💬 Chat History** — Full conversation context with animated messages
- **🌊 Animated Siri Orb** — Dynamic gradient orb with pulsing rings
- **📱 Responsive Design** — Mobile-first, works on all screen sizes
- **✍️ Markdown Rendering** — Rich formatted responses with code blocks, lists, etc.
- **🔮 Suggestion Cards** — Quick-start prompts for instant engagement
- **🌙 Dark Theme** — Elegant dark UI with ambient gradient lighting

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌─────────────────────────────────────┐    │
│  │        Siri AI Frontend (HTML)       │    │
│  │  - Liquid Glass UI                  │    │
│  │  - Voice Input (Web Speech API)     │    │
│  │  - Chat Interface                   │    │
│  └───────────────┬─────────────────────┘    │
│                  │ Direct API Call           │
│                  ▼                           │
│  ┌───────────────────────────────┐          │
│  │   OpenRouter API               │          │
│  │   NVIDIA Nemotron Model        │          │
│  └───────────────────────────────┘          │
└─────────────────────────────────────────────┘
         │
         │ Static Files
         ▼
┌─────────────────────────┐
│    Express Server        │
│    (server.js)           │
│    - Serves HTML/CSS/JS  │
│    - Health check API    │
└─────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- An OpenRouter API key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd SIRI

# Install dependencies
npm install

# Configure your API key
# Edit .env file with your OpenRouter API key
# OPENROUTER_API_KEY=your-api-key-here

# Start the server
npm start
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
SIRI/
├── server.js           # Express.js server
├── package.json        # Dependencies & scripts
├── .env               # Environment variables (API keys)
├── public/
│   └── index.html     # Main frontend (HTML + CSS + JS)
└── README.md          # This file
```

## 🎨 Design Inspiration (from Apple Newsroom)

Based on research from Apple's official Newsroom announcements:

- **Siri AI** (WWDC26, June 2026) — "A profoundly more capable and personal assistant"
- **Liquid Glass** appearance springing from the Dynamic Island
- **Dedicated Siri App** with conversation history
- **Broad World Knowledge** for answers on virtually any topic
- **Conversational** natural back-and-forth dialog
- **Expressive voices** with customizable pace
- **Privacy-first** architecture with on-device processing

### Key Apple Newsroom Sources
- [Apple introduces Siri AI](https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/)
- [WWDC26 Overview](https://www.apple.com/newsroom/2026/06/apple-unveils-next-generation-of-apple-intelligence-siri-ai-and-more/)
- [Apple Intelligence Capabilities](https://www.apple.com/newsroom/2026/06/apple-intelligence-brings-powerful-ai-capabilities-into-everyday-experiences/)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Server | Node.js, Express.js |
| AI Model | NVIDIA Nemotron 3 Nano (via OpenRouter) |
| Voice | Web Speech API |
| Design | CSS Glassmorphism, CSS Animations |

## 📝 API Configuration

The app uses the OpenRouter API with NVIDIA's Nemotron model:

```json
{
  "model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "reasoning": { "enabled": true }
}
```

## License

MIT
