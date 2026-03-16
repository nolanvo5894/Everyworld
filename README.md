# Everyworld

An AI-powered social simulation that designs balanced games from natural language prompts, populates them with autonomous AI agents, and narrates the emergent drama into publishable prose — all in the browser.

Players can spectate or jump in as a participant, negotiating deals, forming alliances, and betraying rivals through text or live voice chat.

## Features

- **Generative game design** — describe a scenario and the engine produces a balanced game spec (agents, resources, actions, win conditions)
- **AI-generated art** — character portraits and world illustrations generated to match the setting
- **Multi-agent simulation** — autonomous agents with private beliefs, memories, relationships, and strategic plans
- **Human participation** — optionally take control of any agent; interact via action selection, text chat, or real-time voice
- **Narrative generation** — each round is narrated into a prose chapter; the full game exports as a cohesive story
- **Story read-aloud (TTS)** — listen to chapters narrated with selectable voices and dramatic reading style
- **Persistent saves** — games are saved to IndexedDB and can be resumed across sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 7 |
| LLM (text) | Gemini 3.0 Flash |
| LLM (images) | Gemini 3.1 Flash Image |
| LLM (voice chat) | Gemini 2.5 Flash Native Audio (WebSocket) |
| LLM (TTS) | Gemini 2.5 Flash Preview TTS |
| Storage | IndexedDB |

## Setup

```bash
# Install dependencies
npm install

# Set your Gemini API key
echo "VITE_GEMINI_API_KEY=your_key_here" > .env

# Start dev server
npm run dev

# Production build
npm run build
```
