# AI Playground

A browser-based tool for testing prompts across multiple AI models side-by-side. Compare responses from OpenAI, Gemini, Anthropic, DeepSeek, Mistral, Cohere, Groq, and Ollama — all in one interface.

![Static Site](https://img.shields.io/badge/Hosting-GitHub%20Pages-blue)
![No Backend](https://img.shields.io/badge/Backend-None-green)
![Models](https://img.shields.io/badge/Models-30+-purple)

## Features

### Core
- **8 AI Providers, 30+ Models** — OpenAI, Gemini, Anthropic, DeepSeek, Mistral, Cohere, Groq, Ollama
- **Side-by-Side Comparison** — send the same prompt to multiple models simultaneously
- **Unlimited Panels** — add as many comparison panels as you need
- **Panel Presets** — one-click setups: "GPT vs Gemini", "Big Three", "Budget Models", "All Flagships"
- **Bring Your Own Keys** — API keys stay in your browser's localStorage, never sent to any server
- **Zero Backend** — pure static site, hosted on GitHub Pages for free
- **Light & Dark Mode** — toggle between themes, preference saved automatically

### Prompt Management
- **Prompt Templates** — 10 built-in templates (Summarize, Code Review, Translate, Debug, etc.) plus save your own custom templates
- **Prompt History** — last 20 prompts saved automatically with timestamps, click to recall, click to delete
- **Collapsible System Prompt** — set a system prompt that applies to all models, collapsed by default to save space, auto-expands when templates fill it
- **Auto-Resize Textarea** — prompt input grows as you type, up to 45% viewport height
- **Character & Word Count** — live count on the prompt input and on each response

### Comparison & Analysis
- **Response Time Bars** — visual bar chart showing which model responded fastest, with "Fastest" badge
- **Live Elapsed Timer** — shows a ticking counter (0.0s... 1.2s...) while each model generates
- **Diff View** — word-level diff highlighting between any two panel responses with color legend
- **Response Pinning** — pin a response so it stays visible when you re-send, for A/B comparison
- **Per-Panel Retry** — re-run a single model without re-triggering all panels
- **Token Usage Stats** — prompt tokens, completion tokens, and total for each response
- **Export as Markdown** — download all responses in one structured `.md` file with metadata

### UX Polish
- **First-Time Welcome** — 3-step onboarding overlay for new users, shown once
- **Toast Notifications** — non-intrusive feedback for actions (copied, exported, saved, etc.)
- **Keyboard Shortcuts** — `Ctrl+Enter` to send, `Escape` to close any modal/dropdown
- **Responsive Design** — works on desktop and mobile, nav labels collapse on small screens

## Supported Providers

| Provider | Models | Free Tier? |
|---|---|---|
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, o3, o3 Mini, o4 Mini | No |
| **Google Gemini** | 2.5 Flash, 2.5 Pro, 2.0 Flash, 2.0 Flash Lite | Yes |
| **Anthropic** | Claude Opus 4, Sonnet 4, Haiku 4, 3.5 Sonnet, 3.5 Haiku | No |
| **DeepSeek** | V3, R1 | Yes (limited) |
| **Mistral** | Large, Medium, Small, Codestral, Nemo | Yes (limited) |
| **Cohere** | Command A, Command R+, Command R, Command Light | Yes (trial) |
| **Groq** | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma 2 9B | Yes |
| **Ollama** | Llama 3.1, Mistral, CodeLlama, Phi-3, Gemma 2 | Local (free) |

## Setup

### GitHub Pages (recommended)

1. Fork or clone this repo into your GitHub organization
2. Go to repo **Settings** > **Pages** > Source: **Deploy from a branch** > **main** / **/ (root)** > Save
3. Visit your GitHub Pages URL (e.g. `https://your-org.github.io/ai-playground/`)
4. Click **Keys** in the nav bar > enter your API keys > Save
5. Start testing prompts

### Local

Just open `index.html` in a browser. No install, no build step, no server needed.

## Notes

- **Anthropic**: Uses the `anthropic-dangerous-direct-browser-access` header for browser-side requests. May have CORS limitations.
- **Ollama**: Requires Ollama running locally. Start with `OLLAMA_ORIGINS=* ollama serve` to enable CORS.
- **API Keys**: Stored in `localStorage` only. Clear browser data to remove them. Keys never leave your browser — all API calls go directly from your browser to the provider.
- **Privacy**: No analytics, no tracking, no telemetry. Your prompts and responses never touch any server other than the AI provider you choose.

## Project Structure

```
├── index.html          # Single-page application
├── css/style.css       # Dark & light themes
├── js/
│   ├── app.js          # UI logic, panels, history, templates, diff, themes
│   └── providers.js    # 8 provider API implementations
└── README.md
```

## Tech Stack

- Pure HTML / CSS / JavaScript — no frameworks, no build step, no dependencies
- 5 files total
- Dark neon theme matching the WaveParticle design system
