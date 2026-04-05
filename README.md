# AI Playground

A browser-based tool for testing prompts across multiple AI models side-by-side. Compare responses from OpenAI, Gemini, Anthropic, DeepSeek, Mistral, Cohere, Groq, and Ollama — all in one interface.

![Static Site](https://img.shields.io/badge/Hosting-GitHub%20Pages-blue)
![No Backend](https://img.shields.io/badge/Backend-None-green)

## Features

### Core
- **8 AI Providers, 30+ Models** — all major LLM providers in one place
- **Side-by-Side Comparison** — send the same prompt to multiple models simultaneously
- **Add Unlimited Panels** — compare as many models as you want
- **System Prompts** — collapsible system prompt field that applies to all models
- **Temperature & Token Controls** — fine-tune generation parameters
- **Bring Your Own Keys** — API keys stay in your browser's localStorage, never sent to any server
- **Zero Backend** — pure static site, hosted on GitHub Pages for free

### Prompt Management
- **Prompt History** — last 20 prompts saved automatically, click to recall, swipe to delete
- **Prompt Templates** — 10 built-in templates (Summarize, Code Review, Translate, etc.) plus save your own
- **Auto-Resize Textarea** — prompt input grows as you type
- **Character & Word Count** — live count on the prompt and on each response

### Comparison Tools
- **Response Time Bars** — visual comparison showing which model responded fastest
- **Diff View** — word-level diff highlighting between any two responses
- **Response Pinning** — pin a response so it stays visible when you re-send for A/B comparison
- **Per-Panel Retry** — re-run a single model without re-triggering all panels
- **Export as Markdown** — download all responses in one structured `.md` file

### Keyboard Shortcuts
- **Ctrl+Enter** — send prompt to all panels

## Supported Providers

| Provider | Models | Free Tier? |
|---|---|---|
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4.1, o3, o4-mini | No |
| **Google Gemini** | 2.5 Flash, 2.5 Pro, 2.0 Flash | Yes |
| **Anthropic** | Claude Opus 4, Sonnet 4, Haiku 4, 3.5 Sonnet | No |
| **DeepSeek** | V3, R1 | Yes (limited) |
| **Mistral** | Large, Medium, Small, Codestral, Nemo | Yes (limited) |
| **Cohere** | Command A, Command R+, Command R | Yes (trial) |
| **Groq** | Llama 3.3 70B, Llama 3.1 8B, Mixtral, Gemma 2 | Yes |
| **Ollama** | Llama 3.1, Mistral, CodeLlama, Phi-3, Gemma 2 | Local (free) |

## Setup

1. Clone this repo
2. Enable GitHub Pages (Settings > Pages > Source: main, folder: / root)
3. Visit your GitHub Pages URL
4. Click **Keys** in the nav bar > enter your API keys > Save
5. Start testing prompts

For local development, just open `index.html` in a browser — no build step needed.

## Notes

- **Anthropic**: Requires the `anthropic-dangerous-direct-browser-access` header. May have CORS issues depending on your setup.
- **Ollama**: Requires Ollama running locally. Start with `OLLAMA_ORIGINS=* ollama serve` to enable CORS.
- **API Keys**: Stored in `localStorage` only. Clear browser data to remove them. Keys never leave your browser.

## Tech Stack

- Pure HTML / CSS / JavaScript — no frameworks, no build step
- Dark neon theme matching the WaveParticle design system
