/**
 * AI Provider implementations — each provider calls its API directly from the browser.
 *
 * Keys are stored in localStorage and never leave the browser.
 *
 * Note: Anthropic does not support CORS from browsers. Requests are routed
 * through a minimal CORS proxy if configured, or will show a CORS error.
 */

const Providers = {

  // =========================================================================
  // Registry — add new providers/models here
  // =========================================================================

  registry: {
    openai: {
      name: 'OpenAI',
      keyName: 'OPENAI_API_KEY',
      keyPlaceholder: 'sk-...',
      models: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4.1', name: 'GPT-4.1' },
        { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
        { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
        { id: 'o4-mini', name: 'o4 Mini' },
        { id: 'o3', name: 'o3' },
        { id: 'o3-mini', name: 'o3 Mini' },
      ],
    },
    anthropic: {
      name: 'Anthropic',
      keyName: 'ANTHROPIC_API_KEY',
      keyPlaceholder: 'sk-ant-...',
      note: 'Anthropic blocks browser CORS. Use a CORS proxy or test from a backend.',
      models: [
        { id: 'claude-opus-4-0', name: 'Claude Opus 4' },
        { id: 'claude-sonnet-4-0', name: 'Claude Sonnet 4' },
        { id: 'claude-haiku-4-0', name: 'Claude Haiku 4' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      ],
    },
    gemini: {
      name: 'Google Gemini',
      keyName: 'GEMINI_API_KEY',
      keyPlaceholder: 'AI...',
      models: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
      ],
    },
    deepseek: {
      name: 'DeepSeek',
      keyName: 'DEEPSEEK_API_KEY',
      keyPlaceholder: 'sk-...',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek V3' },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
      ],
    },
    mistral: {
      name: 'Mistral AI',
      keyName: 'MISTRAL_API_KEY',
      keyPlaceholder: '',
      models: [
        { id: 'mistral-large-latest', name: 'Mistral Large' },
        { id: 'mistral-medium-latest', name: 'Mistral Medium' },
        { id: 'mistral-small-latest', name: 'Mistral Small' },
        { id: 'codestral-latest', name: 'Codestral' },
        { id: 'open-mistral-nemo', name: 'Mistral Nemo' },
      ],
    },
    cohere: {
      name: 'Cohere',
      keyName: 'COHERE_API_KEY',
      keyPlaceholder: '',
      models: [
        { id: 'command-a-03-2025', name: 'Command A' },
        { id: 'command-r-plus-08-2024', name: 'Command R+' },
        { id: 'command-r-08-2024', name: 'Command R' },
        { id: 'command-light', name: 'Command Light' },
      ],
    },
    groq: {
      name: 'Groq',
      keyName: 'GROQ_API_KEY',
      keyPlaceholder: 'gsk_...',
      models: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
      ],
    },
    ollama: {
      name: 'Ollama (Local)',
      keyName: null, // no key needed
      keyPlaceholder: '',
      note: 'Requires Ollama running locally with OLLAMA_ORIGINS=* for CORS.',
      models: [
        { id: 'llama3.1', name: 'Llama 3.1' },
        { id: 'mistral', name: 'Mistral' },
        { id: 'codellama', name: 'Code Llama' },
        { id: 'phi3', name: 'Phi-3' },
        { id: 'gemma2', name: 'Gemma 2' },
      ],
    },
  },

  // =========================================================================
  // Dispatch — call the right provider
  // =========================================================================

  async generate(providerId, modelId, messages, options = {}) {
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 1024;
    const systemPrompt = options.systemPrompt || '';

    switch (providerId) {
      case 'openai':     return this._openai(modelId, messages, systemPrompt, temperature, maxTokens);
      case 'anthropic':  return this._anthropic(modelId, messages, systemPrompt, temperature, maxTokens);
      case 'gemini':     return this._gemini(modelId, messages, systemPrompt, temperature, maxTokens);
      case 'deepseek':   return this._deepseek(modelId, messages, systemPrompt, temperature, maxTokens);
      case 'mistral':    return this._mistral(modelId, messages, systemPrompt, temperature, maxTokens);
      case 'cohere':     return this._cohere(modelId, messages, systemPrompt, temperature, maxTokens);
      case 'groq':       return this._groq(modelId, messages, systemPrompt, temperature, maxTokens);
      case 'ollama':     return this._ollama(modelId, messages, systemPrompt, temperature, maxTokens);
      default:           throw new Error(`Unknown provider: ${providerId}`);
    }
  },

  // =========================================================================
  // OpenAI
  // =========================================================================
  async _openai(model, messages, systemPrompt, temperature, maxTokens) {
    const key = this._getKey('OPENAI_API_KEY');
    const msgs = this._buildMessages(systemPrompt, messages);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages: msgs, temperature, max_tokens: maxTokens }),
    });

    const data = await this._handleResponse(res);
    return {
      text: data.choices[0].message.content,
      usage: data.usage ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens, total: data.usage.total_tokens } : null,
      model: data.model,
    };
  },

  // =========================================================================
  // Anthropic
  // =========================================================================
  async _anthropic(model, messages, systemPrompt, temperature, maxTokens) {
    const key = this._getKey('ANTHROPIC_API_KEY');
    const userMessages = messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const body = { model, messages: userMessages, max_tokens: maxTokens, temperature };
    if (systemPrompt) body.system = systemPrompt;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    const data = await this._handleResponse(res);
    const text = data.content.map(b => b.text).join('');
    return {
      text,
      usage: data.usage ? { prompt: data.usage.input_tokens, completion: data.usage.output_tokens, total: data.usage.input_tokens + data.usage.output_tokens } : null,
      model: data.model,
    };
  },

  // =========================================================================
  // Google Gemini
  // =========================================================================
  async _gemini(model, messages, systemPrompt, temperature, maxTokens) {
    const key = this._getKey('GEMINI_API_KEY');

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    const data = await this._handleResponse(res);
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    const meta = data.usageMetadata;
    return {
      text,
      usage: meta ? { prompt: meta.promptTokenCount || 0, completion: meta.candidatesTokenCount || 0, total: meta.totalTokenCount || 0 } : null,
      model,
    };
  },

  // =========================================================================
  // DeepSeek (OpenAI-compatible)
  // =========================================================================
  async _deepseek(model, messages, systemPrompt, temperature, maxTokens) {
    const key = this._getKey('DEEPSEEK_API_KEY');
    const msgs = this._buildMessages(systemPrompt, messages);

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages: msgs, temperature, max_tokens: maxTokens }),
    });

    const data = await this._handleResponse(res);
    return {
      text: data.choices[0].message.content,
      usage: data.usage ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens, total: data.usage.total_tokens } : null,
      model: data.model,
    };
  },

  // =========================================================================
  // Mistral (OpenAI-compatible)
  // =========================================================================
  async _mistral(model, messages, systemPrompt, temperature, maxTokens) {
    const key = this._getKey('MISTRAL_API_KEY');
    const msgs = this._buildMessages(systemPrompt, messages);

    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages: msgs, temperature, max_tokens: maxTokens }),
    });

    const data = await this._handleResponse(res);
    return {
      text: data.choices[0].message.content,
      usage: data.usage ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens, total: data.usage.total_tokens } : null,
      model: data.model,
    };
  },

  // =========================================================================
  // Cohere
  // =========================================================================
  async _cohere(model, messages, systemPrompt, temperature, maxTokens) {
    const key = this._getKey('COHERE_API_KEY');

    const chatHistory = [];
    let lastUserMsg = '';
    for (const m of messages) {
      if (m.role === 'user') lastUserMsg = m.content;
      else chatHistory.push({ role: m.role === 'assistant' ? 'CHATBOT' : 'USER', message: m.content });
    }

    const body = { model, message: lastUserMsg, temperature, max_tokens: maxTokens };
    if (systemPrompt) body.preamble = systemPrompt;
    if (chatHistory.length) body.chat_history = chatHistory;

    const res = await fetch('https://api.cohere.com/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(body),
    });

    const data = await this._handleResponse(res);
    return {
      text: data.text,
      usage: data.meta?.tokens ? { prompt: data.meta.tokens.input_tokens, completion: data.meta.tokens.output_tokens, total: (data.meta.tokens.input_tokens || 0) + (data.meta.tokens.output_tokens || 0) } : null,
      model,
    };
  },

  // =========================================================================
  // Groq (OpenAI-compatible)
  // =========================================================================
  async _groq(model, messages, systemPrompt, temperature, maxTokens) {
    const key = this._getKey('GROQ_API_KEY');
    const msgs = this._buildMessages(systemPrompt, messages);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model, messages: msgs, temperature, max_tokens: maxTokens }),
    });

    const data = await this._handleResponse(res);
    return {
      text: data.choices[0].message.content,
      usage: data.usage ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens, total: data.usage.total_tokens } : null,
      model: data.model,
    };
  },

  // =========================================================================
  // Ollama (local)
  // =========================================================================
  async _ollama(model, messages, systemPrompt, temperature, maxTokens) {
    const baseUrl = localStorage.getItem('OLLAMA_URL') || 'http://localhost:11434';
    const msgs = this._buildMessages(systemPrompt, messages);

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: msgs, stream: false, options: { temperature, num_predict: maxTokens } }),
    });

    const data = await this._handleResponse(res);
    return {
      text: data.message?.content || '',
      usage: data.eval_count ? { prompt: data.prompt_eval_count || 0, completion: data.eval_count || 0, total: (data.prompt_eval_count || 0) + (data.eval_count || 0) } : null,
      model,
    };
  },

  // =========================================================================
  // Helpers
  // =========================================================================

  _getKey(keyName) {
    const key = localStorage.getItem(keyName);
    if (!key) throw new Error(`API key not set. Go to Settings and add your ${keyName}.`);
    return key;
  },

  _buildMessages(systemPrompt, messages) {
    const msgs = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    msgs.push(...messages);
    return msgs;
  },

  async _handleResponse(res) {
    if (!res.ok) {
      let errorText;
      try {
        const errData = await res.json();
        errorText = errData.error?.message || errData.message || errData.detail || JSON.stringify(errData);
      } catch {
        errorText = await res.text();
      }
      throw new Error(`API error (${res.status}): ${errorText}`);
    }
    return res.json();
  },
};
