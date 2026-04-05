/**
 * AI Playground — main application logic.
 */
document.addEventListener('DOMContentLoaded', () => {

  const registry = Providers.registry;
  let panelCount = 2; // start with 2 panels

  // =========================================================================
  // First-time welcome
  // =========================================================================

  const welcomeOverlay = document.getElementById('welcomeOverlay');
  if (localStorage.getItem('welcomeDismissed')) {
    welcomeOverlay.classList.add('hidden');
  }
  document.getElementById('welcomeDismiss').addEventListener('click', () => {
    welcomeOverlay.classList.add('hidden');
    localStorage.setItem('welcomeDismissed', '1');
  });

  // =========================================================================
  // Initialize provider/model dropdowns
  // =========================================================================

  function populateProviderSelect(selectEl) {
    selectEl.innerHTML = '<option value="">-- Provider --</option>';
    for (const [id, provider] of Object.entries(registry)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = provider.name;
      selectEl.appendChild(opt);
    }
  }

  function populateModelSelect(selectEl, providerId) {
    selectEl.innerHTML = '<option value="">-- Model --</option>';
    if (!providerId || !registry[providerId]) return;
    for (const model of registry[providerId].models) {
      const opt = document.createElement('option');
      opt.value = model.id;
      opt.textContent = model.name;
      selectEl.appendChild(opt);
    }
    // Auto-select first model
    if (registry[providerId].models.length) {
      selectEl.value = registry[providerId].models[0].id;
    }
  }

  // Init existing panels
  document.querySelectorAll('.select-provider').forEach(sel => {
    populateProviderSelect(sel);
  });

  // Provider change → populate models
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('select-provider')) {
      const idx = e.target.dataset.index;
      const modelSel = document.querySelector(`.select-model[data-index="${idx}"]`);
      populateModelSelect(modelSel, e.target.value);

      // Show provider note if any
      const statusEl = document.querySelector(`.panel-status[data-index="${idx}"]`);
      const provider = registry[e.target.value];
      if (provider?.note) {
        statusEl.textContent = provider.note;
        statusEl.className = 'panel-status status-warn';
      } else {
        statusEl.textContent = '';
        statusEl.className = 'panel-status';
      }
    }
  });

  // Set default selections: panel 0 = OpenAI GPT-4o, panel 1 = Gemini 2.5 Flash
  const defaults = [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'gemini', model: 'gemini-2.5-flash' },
  ];
  defaults.forEach((def, i) => {
    const provSel = document.querySelector(`.select-provider[data-index="${i}"]`);
    const modSel = document.querySelector(`.select-model[data-index="${i}"]`);
    if (provSel) {
      provSel.value = def.provider;
      populateModelSelect(modSel, def.provider);
      modSel.value = def.model;
    }
  });

  // =========================================================================
  // Temperature slider
  // =========================================================================

  const tempSlider = document.getElementById('temperature');
  const tempValue = document.getElementById('tempValue');
  tempSlider.addEventListener('input', () => {
    tempValue.textContent = tempSlider.value;
  });

  // =========================================================================
  // Light/dark theme toggle
  // =========================================================================

  const themeLabel = document.getElementById('themeLabel');
  const themeIcon = document.getElementById('themeIcon');

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light');
      themeLabel.textContent = 'Dark';
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      document.body.classList.remove('light');
      themeLabel.textContent = 'Light';
      themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
    localStorage.setItem('theme', theme);
  }

  // Load saved theme
  applyTheme(localStorage.getItem('theme') || 'dark');

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  });

  // =========================================================================
  // Panel presets
  // =========================================================================

  const presetMenu = document.getElementById('presetMenu');

  const presetConfigs = {
    'gpt-vs-gemini': [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'gemini', model: 'gemini-2.5-flash' },
    ],
    'big-three': [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'gemini', model: 'gemini-2.5-flash' },
      { provider: 'anthropic', model: 'claude-sonnet-4-0' },
    ],
    'budget': [
      { provider: 'openai', model: 'gpt-4o-mini' },
      { provider: 'gemini', model: 'gemini-2.0-flash' },
      { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    ],
    'all-flagships': [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'gemini', model: 'gemini-2.5-flash' },
      { provider: 'anthropic', model: 'claude-sonnet-4-0' },
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'mistral', model: 'mistral-large-latest' },
    ],
  };

  document.getElementById('presetToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    presetMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#presetDropdown')) {
      presetMenu.classList.add('hidden');
    }
  });

  presetMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.preset-item');
    if (!item) return;

    const config = presetConfigs[item.dataset.preset];
    if (!config) return;

    // Clear existing panels
    const container = document.getElementById('panelsContainer');
    container.innerHTML = '';
    panelCount = 0;

    // Create panels for the preset
    config.forEach(cfg => {
      const idx = panelCount++;
      const panel = document.createElement('div');
      panel.className = 'response-panel glass-panel';
      panel.dataset.index = idx;
      panel.innerHTML = `
        <div class="panel-header">
          <select class="select-provider" data-index="${idx}"></select>
          <select class="select-model" data-index="${idx}"></select>
          <button class="btn-icon btn-sm panel-retry" data-index="${idx}" title="Retry this panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          <button class="btn-icon btn-sm panel-remove" data-index="${idx}" title="Remove panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="panel-status" data-index="${idx}"></div>
        <div class="panel-body" data-index="${idx}">
          <div class="panel-placeholder">Select a provider and model, then send a prompt.</div>
        </div>
        <div class="pinned-response hidden" data-index="${idx}"></div>
        <div class="panel-footer hidden" data-index="${idx}">
          <span class="token-info" data-index="${idx}"></span>
          <div class="footer-actions">
            <button class="btn-ghost btn-sm pin-response" data-index="${idx}" title="Pin this response">Pin</button>
            <button class="btn-ghost btn-sm copy-response" data-index="${idx}">Copy</button>
          </div>
        </div>
      `;
      container.appendChild(panel);

      const provSel = panel.querySelector('.select-provider');
      const modSel = panel.querySelector('.select-model');
      populateProviderSelect(provSel);
      provSel.value = cfg.provider;
      populateModelSelect(modSel, cfg.provider);
      modSel.value = cfg.model;
    });

    presetMenu.classList.add('hidden');
    showToast(`Loaded preset: ${item.textContent}`);
  });

  // =========================================================================
  // Collapsible system prompt
  // =========================================================================

  const sysToggle = document.getElementById('systemPromptToggle');
  const sysContent = document.getElementById('systemPromptContent');
  const sysGroup = sysToggle.closest('.collapsible');

  sysToggle.addEventListener('click', () => {
    sysContent.classList.toggle('hidden');
    sysGroup.classList.toggle('open');
  });

  // =========================================================================
  // Prompt templates
  // =========================================================================

  const builtinTemplates = [
    { name: 'Summarize', prompt: 'Summarize the following text in 3-5 bullet points:\n\n', system: '' },
    { name: 'Explain Simply', prompt: 'Explain the following concept as if I were a beginner with no technical background:\n\n', system: '' },
    { name: 'Translate', prompt: 'Translate the following text to [TARGET LANGUAGE]:\n\n', system: 'You are a professional translator. Preserve tone, meaning, and formatting.' },
    { name: 'Code Review', prompt: 'Review the following code for bugs, performance issues, and best practices. Suggest improvements:\n\n```\n\n```', system: 'You are a senior software engineer doing a thorough code review.' },
    { name: 'Write Unit Tests', prompt: 'Write comprehensive unit tests for the following code:\n\n```\n\n```', system: 'You are a testing expert. Use the most appropriate test framework for the language.' },
    { name: 'Debug This', prompt: 'I\'m getting the following error. Help me debug it:\n\nError:\n\nCode:\n```\n\n```', system: '' },
    { name: 'Pros and Cons', prompt: 'List the pros and cons of the following:\n\n', system: 'Be balanced and objective. Format as two clear lists.' },
    { name: 'Rewrite Formally', prompt: 'Rewrite the following text in a professional, formal tone:\n\n', system: '' },
    { name: 'Generate SQL', prompt: 'Write a SQL query to:\n\nTable schema:\n', system: 'You are a database expert. Write clean, efficient SQL. Add comments explaining complex parts.' },
    { name: 'Brainstorm Ideas', prompt: 'Brainstorm 10 creative ideas for:\n\n', system: 'Think outside the box. Be creative and diverse in your suggestions.' },
  ];

  const templateSelect = document.getElementById('templateSelect');
  const builtinGroup = document.getElementById('builtinTemplates');
  const customGroup = document.getElementById('customTemplates');

  function renderTemplateOptions() {
    // Built-in
    builtinGroup.innerHTML = '';
    builtinTemplates.forEach((t, i) => {
      const opt = document.createElement('option');
      opt.value = `builtin:${i}`;
      opt.textContent = t.name;
      builtinGroup.appendChild(opt);
    });

    // Custom
    customGroup.innerHTML = '';
    const custom = getCustomTemplates();
    if (custom.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.disabled = true;
      opt.textContent = '(none saved yet)';
      customGroup.appendChild(opt);
    } else {
      custom.forEach((t, i) => {
        const opt = document.createElement('option');
        opt.value = `custom:${i}`;
        opt.textContent = t.name;
        customGroup.appendChild(opt);
      });
    }
  }

  function getCustomTemplates() {
    try { return JSON.parse(localStorage.getItem('promptTemplates') || '[]'); }
    catch { return []; }
  }

  templateSelect.addEventListener('change', () => {
    const val = templateSelect.value;
    if (!val) return;

    const [type, idx] = val.split(':');
    const index = parseInt(idx);
    let template;

    if (type === 'builtin') {
      template = builtinTemplates[index];
    } else {
      template = getCustomTemplates()[index];
    }

    if (template) {
      document.getElementById('userPrompt').value = template.prompt;
      if (template.system) {
        document.getElementById('systemPrompt').value = template.system;
      }
      updatePromptCount();
    }

    // Reset select
    templateSelect.value = '';
  });

  document.getElementById('saveTemplateBtn').addEventListener('click', () => {
    const prompt = document.getElementById('userPrompt').value.trim();
    const system = document.getElementById('systemPrompt').value.trim();

    if (!prompt) {
      alert('Write a prompt first, then save it as a template.');
      return;
    }

    const name = window.prompt('Template name:');
    if (!name || !name.trim()) return;

    const custom = getCustomTemplates();
    custom.push({ name: name.trim(), prompt, system });
    localStorage.setItem('promptTemplates', JSON.stringify(custom));
    renderTemplateOptions();
  });

  renderTemplateOptions();

  // =========================================================================
  // Prompt character/word count
  // =========================================================================

  const promptCount = document.getElementById('promptCount');
  const userPromptEl = document.getElementById('userPrompt');

  function updatePromptCount() {
    const text = userPromptEl.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    promptCount.textContent = `${chars} chars · ${words} words`;
  }

  function autoResizeTextarea() {
    userPromptEl.style.height = 'auto';
    const maxHeight = window.innerHeight * 0.45;
    userPromptEl.style.height = Math.min(userPromptEl.scrollHeight, maxHeight) + 'px';
  }

  userPromptEl.addEventListener('input', () => {
    updatePromptCount();
    autoResizeTextarea();
  });

  // =========================================================================
  // Send prompt to all panels
  // =========================================================================

  document.getElementById('sendBtn').addEventListener('click', sendToAll);

  // Ctrl+Enter to send
  document.getElementById('userPrompt').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendToAll();
    }
  });

  async function sendToPanel(panel, userPrompt, systemPrompt, temperature, maxTokens) {
    const idx = panel.dataset.index;
    const providerId = panel.querySelector('.select-provider').value;
    const modelId = panel.querySelector('.select-model').value;
    const bodyEl = panel.querySelector(`.panel-body[data-index="${idx}"]`);
    const statusEl = panel.querySelector(`.panel-status[data-index="${idx}"]`);
    const footerEl = panel.querySelector(`.panel-footer[data-index="${idx}"]`);
    const tokenEl = panel.querySelector(`.token-info[data-index="${idx}"]`);

    if (!providerId || !modelId) {
      statusEl.textContent = 'Select a provider and model first.';
      statusEl.className = 'panel-status status-warn';
      return;
    }

    // Check if key is set (except Ollama)
    const provider = registry[providerId];
    if (provider.keyName && !localStorage.getItem(provider.keyName)) {
      statusEl.textContent = `No API key set for ${provider.name}. Go to Settings.`;
      statusEl.className = 'panel-status status-error';
      return;
    }

    // Remove existing time bar
    const existingBar = panel.querySelector('.time-bar-container');
    if (existingBar) existingBar.remove();

    // Loading state with live timer
    bodyEl.innerHTML = '<div class="loading"><div class="spinner"></div><span>Generating...</span></div>';
    statusEl.textContent = '0.0s';
    statusEl.className = 'panel-status status-timing';
    footerEl.classList.add('hidden');

    const startTime = performance.now();
    const loadingTimer = setInterval(() => {
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      statusEl.textContent = `${elapsed}s`;
    }, 100);

    try {
      const result = await Providers.generate(providerId, modelId, [
        { role: 'user', content: userPrompt }
      ], { systemPrompt, temperature, maxTokens });

      clearInterval(loadingTimer);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

      // Render response
      bodyEl.innerHTML = `<div class="response-text">${escapeAndFormat(result.text)}</div>`;
      statusEl.textContent = `Completed in ${elapsed}s`;
      statusEl.className = 'panel-status status-ok';

      // Token info + word/char count
      const resChars = result.text.length;
      const resWords = result.text.trim() ? result.text.trim().split(/\s+/).length : 0;
      let infoText = `${resChars} chars · ${resWords} words`;
      if (result.usage) {
        infoText += ` · Tokens: ${result.usage.prompt} in / ${result.usage.completion} out / ${result.usage.total} total`;
      }
      tokenEl.textContent = infoText;
      footerEl.classList.remove('hidden');
      footerEl.dataset.response = result.text;

    } catch (err) {
      clearInterval(loadingTimer);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      bodyEl.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
      statusEl.textContent = `Failed after ${elapsed}s`;
      statusEl.className = 'panel-status status-error';
    }
  }

  async function sendToAll() {
    const userPrompt = document.getElementById('userPrompt').value.trim();
    if (!userPrompt) return;

    // Save to history
    saveToHistory(userPrompt);

    const systemPrompt = document.getElementById('systemPrompt').value.trim();
    const temperature = parseFloat(tempSlider.value);
    const maxTokens = parseInt(document.getElementById('maxTokens').value) || 1024;

    const panels = document.querySelectorAll('.response-panel');
    const promises = Array.from(panels).map(panel => sendToPanel(panel, userPrompt, systemPrompt, temperature, maxTokens));
    await Promise.allSettled(promises);

    // Render response time comparison bars
    renderTimeBars();
  }

  // Retry single panel
  document.addEventListener('click', async (e) => {
    const retryBtn = e.target.closest('.panel-retry');
    if (!retryBtn) return;

    const panel = retryBtn.closest('.response-panel');
    if (!panel) return;

    const userPrompt = document.getElementById('userPrompt').value.trim();
    if (!userPrompt) return;

    const systemPrompt = document.getElementById('systemPrompt').value.trim();
    const temperature = parseFloat(tempSlider.value);
    const maxTokens = parseInt(document.getElementById('maxTokens').value) || 1024;

    await sendToPanel(panel, userPrompt, systemPrompt, temperature, maxTokens);
    renderTimeBars();
  });

  function renderTimeBars() {
    const panels = document.querySelectorAll('.response-panel');
    const times = [];

    // Collect elapsed times from status text
    panels.forEach(panel => {
      const idx = panel.dataset.index;
      const statusEl = panel.querySelector(`.panel-status[data-index="${idx}"]`);
      const text = statusEl?.textContent || '';
      const match = text.match(/([\d.]+)s/);
      const elapsed = match ? parseFloat(match[1]) : null;
      times.push({ idx, elapsed, panel, statusEl, failed: statusEl?.classList.contains('status-error') });
    });

    const validTimes = times.filter(t => t.elapsed !== null);
    if (validTimes.length < 2) return;

    const maxTime = Math.max(...validTimes.map(t => t.elapsed));
    const minTime = Math.min(...validTimes.map(t => t.elapsed));

    validTimes.forEach(t => {
      // Remove existing bar if any
      const existing = t.panel.querySelector('.time-bar-container');
      if (existing) existing.remove();

      const pct = maxTime > 0 ? (t.elapsed / maxTime) * 100 : 100;
      const isFastest = t.elapsed === minTime && validTimes.length > 1 && !t.failed;

      const bar = document.createElement('div');
      bar.className = 'time-bar-container';
      bar.innerHTML = `
        <div class="time-bar">
          <div class="time-bar-fill ${t.failed ? 'time-bar-error' : isFastest ? 'time-bar-fastest' : ''}"
               style="width: ${pct}%"></div>
        </div>
        ${isFastest ? '<span class="time-bar-badge">Fastest</span>' : ''}
      `;

      // Insert after status
      t.statusEl.after(bar);
    });
  }

  // =========================================================================
  // Add / remove panels
  // =========================================================================

  document.getElementById('addPanelBtn').addEventListener('click', () => {
    const container = document.getElementById('panelsContainer');
    const idx = panelCount++;
    const panel = document.createElement('div');
    panel.className = 'response-panel glass-panel';
    panel.dataset.index = idx;
    panel.innerHTML = `
      <div class="panel-header">
        <select class="select-provider" data-index="${idx}"></select>
        <select class="select-model" data-index="${idx}"></select>
        <button class="btn-icon btn-sm panel-retry" data-index="${idx}" title="Retry this panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
        <button class="btn-icon btn-sm panel-remove" data-index="${idx}" title="Remove panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="panel-status" data-index="${idx}"></div>
      <div class="panel-body" data-index="${idx}">
        <div class="panel-placeholder">Select a provider and model, then send a prompt.</div>
      </div>
      <div class="pinned-response hidden" data-index="${idx}"></div>
      <div class="panel-footer hidden" data-index="${idx}">
        <span class="token-info" data-index="${idx}"></span>
        <div class="footer-actions">
          <button class="btn-ghost btn-sm pin-response" data-index="${idx}" title="Pin this response">Pin</button>
          <button class="btn-ghost btn-sm copy-response" data-index="${idx}">Copy</button>
        </div>
      </div>
    `;
    container.appendChild(panel);
    populateProviderSelect(panel.querySelector('.select-provider'));
  });

  document.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.panel-remove');
    if (removeBtn) {
      const panels = document.querySelectorAll('.response-panel');
      if (panels.length <= 1) return; // keep at least 1
      removeBtn.closest('.response-panel').remove();
    }
  });

  // =========================================================================
  // Copy response
  // =========================================================================

  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-response');
    if (copyBtn) {
      const idx = copyBtn.dataset.index;
      const bodyEl = document.querySelector(`.panel-body[data-index="${idx}"]`);
      const text = bodyEl?.innerText || '';
      navigator.clipboard.writeText(text).then(() => showToast('Response copied!'));
    }
  });

  // =========================================================================
  // Pin response
  // =========================================================================

  document.addEventListener('click', (e) => {
    const pinBtn = e.target.closest('.pin-response');
    if (!pinBtn) return;

    const panel = pinBtn.closest('.response-panel');
    const idx = pinBtn.dataset.index;
    const bodyEl = panel.querySelector(`.panel-body[data-index="${idx}"]`);
    const pinnedEl = panel.querySelector(`.pinned-response[data-index="${idx}"]`);
    const responseText = bodyEl?.innerHTML || '';

    if (pinnedEl.classList.contains('hidden')) {
      // Pin current response
      const provSel = panel.querySelector('.select-provider');
      const modSel = panel.querySelector('.select-model');
      const statusEl = panel.querySelector(`.panel-status[data-index="${idx}"]`);
      const pName = provSel.options[provSel.selectedIndex]?.text || '';
      const mName = modSel.options[modSel.selectedIndex]?.text || '';
      const statusText = statusEl?.textContent || '';

      pinnedEl.innerHTML = `
        <div class="pinned-header">
          <span class="pinned-label">Pinned: ${escapeHtml(pName)} — ${escapeHtml(mName)}</span>
          <span class="text-dim text-xs">${escapeHtml(statusText)}</span>
          <button class="btn-ghost btn-sm unpin-btn" data-index="${idx}">Unpin</button>
        </div>
        <div class="pinned-body">${responseText}</div>
      `;
      pinnedEl.classList.remove('hidden');
      pinBtn.textContent = 'Pinned';
      pinBtn.classList.add('btn-active');
    } else {
      // Unpin
      pinnedEl.innerHTML = '';
      pinnedEl.classList.add('hidden');
      pinBtn.textContent = 'Pin';
      pinBtn.classList.remove('btn-active');
    }
  });

  // Unpin via the unpin button inside pinned area
  document.addEventListener('click', (e) => {
    const unpinBtn = e.target.closest('.unpin-btn');
    if (!unpinBtn) return;

    const idx = unpinBtn.dataset.index;
    const panel = unpinBtn.closest('.response-panel');
    const pinnedEl = panel.querySelector(`.pinned-response[data-index="${idx}"]`);
    const pinBtn = panel.querySelector(`.pin-response[data-index="${idx}"]`);

    pinnedEl.innerHTML = '';
    pinnedEl.classList.add('hidden');
    if (pinBtn) {
      pinBtn.textContent = 'Pin';
      pinBtn.classList.remove('btn-active');
    }
  });

  // =========================================================================
  // Quick actions
  // =========================================================================

  document.getElementById('clearAllBtn').addEventListener('click', () => {
    document.getElementById('userPrompt').value = '';
    document.getElementById('systemPrompt').value = '';
    document.querySelectorAll('.panel-body').forEach(el => {
      el.innerHTML = '<div class="panel-placeholder">Select a provider and model, then send a prompt.</div>';
    });
    document.querySelectorAll('.panel-status').forEach(el => {
      el.textContent = '';
      el.className = 'panel-status';
    });
    document.querySelectorAll('.panel-footer').forEach(el => el.classList.add('hidden'));
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const userPrompt = document.getElementById('userPrompt').value.trim();
    const systemPrompt = document.getElementById('systemPrompt').value.trim();
    const temperature = tempSlider.value;
    const maxTokens = document.getElementById('maxTokens').value;

    let md = `# AI Playground — Comparison\n\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n`;

    if (systemPrompt) {
      md += `## System Prompt\n\n\`\`\`\n${systemPrompt}\n\`\`\`\n\n`;
    }

    md += `## Prompt\n\n${userPrompt || '(empty)'}\n\n`;
    md += `**Temperature:** ${temperature} | **Max Tokens:** ${maxTokens}\n\n`;
    md += `---\n\n`;

    const panels = document.querySelectorAll('.response-panel');
    let hasContent = false;

    panels.forEach((panel) => {
      const idx = panel.dataset.index;
      const providerSel = panel.querySelector('.select-provider');
      const modelSel = panel.querySelector('.select-model');
      const providerName = providerSel.options[providerSel.selectedIndex]?.text || 'Unknown';
      const modelName = modelSel.options[modelSel.selectedIndex]?.text || 'Unknown';
      const bodyEl = panel.querySelector(`.panel-body[data-index="${idx}"]`);
      const statusEl = panel.querySelector(`.panel-status[data-index="${idx}"]`);
      const tokenEl = panel.querySelector(`.token-info[data-index="${idx}"]`);
      const responseText = bodyEl?.innerText?.trim() || '';

      if (!providerSel.value || responseText === 'Select a provider and model, then send a prompt.') return;

      hasContent = true;
      md += `## ${providerName} — ${modelName}\n\n`;
      md += `**Status:** ${statusEl?.textContent || 'N/A'}\n`;
      if (tokenEl?.textContent) {
        md += `**${tokenEl.textContent}**\n`;
      }
      md += `\n${responseText}\n\n---\n\n`;
    });

    if (!hasContent) {
      alert('No responses to export. Send a prompt first.');
      return;
    }

    // Download
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-comparison-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Comparison exported!');
  });

  document.getElementById('copyPromptBtn').addEventListener('click', () => {
    const text = document.getElementById('userPrompt').value;
    navigator.clipboard.writeText(text).then(() => showToast('Prompt copied!'));
  });

  // =========================================================================
  // Settings modal
  // =========================================================================

  const settingsModal = document.getElementById('settingsModal');
  const settingsForm = document.getElementById('settingsForm');

  document.getElementById('settingsBtn').addEventListener('click', () => {
    settingsForm.innerHTML = '';
    for (const [id, provider] of Object.entries(registry)) {
      if (!provider.keyName) continue;
      const current = localStorage.getItem(provider.keyName) || '';
      const div = document.createElement('div');
      div.className = 'settings-row';
      div.innerHTML = `
        <label class="label">${provider.name}</label>
        <div class="key-input-row">
          <input type="password" class="input-field key-input" data-key="${provider.keyName}"
                 value="${current}" placeholder="${provider.keyPlaceholder || 'Enter API key'}">
          <button class="btn-icon btn-sm toggle-visibility" title="Show/hide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
        ${provider.note ? `<p class="text-dim text-xs mt-1">${provider.note}</p>` : ''}
      `;
      settingsForm.appendChild(div);
    }

    // Ollama URL
    document.getElementById('ollamaUrl').value = localStorage.getItem('OLLAMA_URL') || '';

    settingsModal.classList.remove('hidden');
  });

  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  // Toggle password visibility
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.toggle-visibility');
    if (toggleBtn) {
      const input = toggleBtn.parentElement.querySelector('.key-input');
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    document.querySelectorAll('.key-input').forEach(input => {
      const key = input.dataset.key;
      const val = input.value.trim();
      if (val) {
        localStorage.setItem(key, val);
      } else {
        localStorage.removeItem(key);
      }
    });

    const ollamaUrl = document.getElementById('ollamaUrl').value.trim();
    if (ollamaUrl) {
      localStorage.setItem('OLLAMA_URL', ollamaUrl);
    } else {
      localStorage.removeItem('OLLAMA_URL');
    }

    settingsModal.classList.add('hidden');
    showToast('API keys saved!');
  });

  // =========================================================================
  // Prompt history
  // =========================================================================

  const MAX_HISTORY = 20;
  const historyMenu = document.getElementById('historyMenu');
  const historyList = document.getElementById('historyList');

  document.getElementById('historyToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    historyMenu.classList.toggle('hidden');
    if (!historyMenu.classList.contains('hidden')) {
      renderHistory();
    }
  });

  // Close history menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#historyDropdown')) {
      historyMenu.classList.add('hidden');
    }
  });

  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    localStorage.removeItem('promptHistory');
    renderHistory();
  });

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('promptHistory') || '[]');
    } catch { return []; }
  }

  function saveToHistory(prompt) {
    let history = getHistory();
    // Remove duplicate if exists
    history = history.filter(h => h.text !== prompt);
    // Add to front
    history.unshift({ text: prompt, timestamp: Date.now() });
    // Keep max
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem('promptHistory', JSON.stringify(history));
  }

  function renderHistory() {
    const history = getHistory();
    if (!history.length) {
      historyList.innerHTML = '<div class="history-empty text-dim text-xs">No history yet</div>';
      return;
    }
    historyList.innerHTML = history.map((h, i) => {
      const preview = h.text.length > 80 ? h.text.slice(0, 80) + '...' : h.text;
      const time = new Date(h.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `
        <div class="history-item" data-index="${i}">
          <div class="history-item-content" data-index="${i}">
            <div class="history-preview">${escapeHtml(preview)}</div>
            <div class="history-time text-dim text-xs">${time}</div>
          </div>
          <button class="btn-icon btn-sm history-delete" data-index="${i}" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    }).join('');

    // Click to load prompt
    historyList.querySelectorAll('.history-item-content').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        const history = getHistory();
        if (history[idx]) {
          document.getElementById('userPrompt').value = history[idx].text;
          historyMenu.classList.add('hidden');
        }
      });
    });

    // Click to delete
    historyList.querySelectorAll('.history-delete').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.index);
        const history = getHistory();
        history.splice(idx, 1);
        localStorage.setItem('promptHistory', JSON.stringify(history));
        renderHistory();
      });
    });
  }

  // =========================================================================
  // Diff view
  // =========================================================================

  const diffModal = document.getElementById('diffModal');
  const diffSelectA = document.getElementById('diffSelectA');
  const diffSelectB = document.getElementById('diffSelectB');
  const diffOutput = document.getElementById('diffOutput');

  function getPanelLabel(panel) {
    const provSel = panel.querySelector('.select-provider');
    const modSel = panel.querySelector('.select-model');
    const pName = provSel.options[provSel.selectedIndex]?.text || 'Unknown';
    const mName = modSel.options[modSel.selectedIndex]?.text || 'Unknown';
    return `${pName} — ${mName}`;
  }

  function getPanelResponseText(panel) {
    const idx = panel.dataset.index;
    const bodyEl = panel.querySelector(`.panel-body[data-index="${idx}"]`);
    return bodyEl?.innerText?.trim() || '';
  }

  document.getElementById('diffBtn').addEventListener('click', () => {
    const panels = document.querySelectorAll('.response-panel');

    // Populate selectors
    [diffSelectA, diffSelectB].forEach(sel => {
      sel.innerHTML = '';
      panels.forEach((panel, i) => {
        const label = getPanelLabel(panel);
        const text = getPanelResponseText(panel);
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = label;
        opt.disabled = !text || text === 'Select a provider and model, then send a prompt.';
        sel.appendChild(opt);
      });
    });

    // Default: select first two different panels
    if (panels.length >= 2) {
      diffSelectA.value = '0';
      diffSelectB.value = '1';
    }

    diffOutput.innerHTML = '<div class="panel-placeholder">Select two panels and click Compare.</div>';
    diffModal.classList.remove('hidden');
  });

  document.getElementById('closeDiffBtn').addEventListener('click', () => {
    diffModal.classList.add('hidden');
  });
  diffModal.addEventListener('click', (e) => {
    if (e.target === diffModal) diffModal.classList.add('hidden');
  });

  document.getElementById('runDiffBtn').addEventListener('click', () => {
    const panels = Array.from(document.querySelectorAll('.response-panel'));
    const idxA = parseInt(diffSelectA.value);
    const idxB = parseInt(diffSelectB.value);

    if (isNaN(idxA) || isNaN(idxB)) return;

    const textA = getPanelResponseText(panels[idxA]);
    const textB = getPanelResponseText(panels[idxB]);

    if (!textA || !textB) {
      diffOutput.innerHTML = '<div class="error-text">Both panels need responses. Send a prompt first.</div>';
      return;
    }

    const labelA = getPanelLabel(panels[idxA]);
    const labelB = getPanelLabel(panels[idxB]);

    const diffHtml = computeWordDiff(textA, textB);
    diffOutput.innerHTML = `
      <div class="diff-labels">
        <span class="diff-label diff-label-a">${escapeHtml(labelA)}</span>
        <span class="diff-label diff-label-b">${escapeHtml(labelB)}</span>
      </div>
      <div class="diff-content">${diffHtml}</div>
    `;
  });

  /**
   * Simple word-level diff using longest common subsequence.
   */
  function computeWordDiff(textA, textB) {
    const wordsA = textA.split(/(\s+)/);
    const wordsB = textB.split(/(\s+)/);

    // LCS table
    const m = wordsA.length, n = wordsB.length;
    // For very long texts, fall back to simpler approach
    if (m * n > 500000) {
      return `<span class="diff-remove">${escapeHtml(textA)}</span><br><br><span class="diff-add">${escapeHtml(textB)}</span>`;
    }

    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (wordsA[i - 1] === wordsB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack
    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
        result.unshift({ type: 'same', text: wordsA[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'add', text: wordsB[j - 1] });
        j--;
      } else {
        result.unshift({ type: 'remove', text: wordsA[i - 1] });
        i--;
      }
    }

    // Render
    let html = '';
    let currentType = null;
    let buffer = '';

    for (const item of result) {
      if (item.type !== currentType) {
        if (buffer) {
          html += wrapDiff(currentType, buffer);
          buffer = '';
        }
        currentType = item.type;
      }
      buffer += item.text;
    }
    if (buffer) html += wrapDiff(currentType, buffer);

    return html;
  }

  function wrapDiff(type, text) {
    const escaped = escapeHtml(text).replace(/\n/g, '<br>');
    if (type === 'add') return `<span class="diff-add">${escaped}</span>`;
    if (type === 'remove') return `<span class="diff-remove">${escaped}</span>`;
    return `<span class="diff-same">${escaped}</span>`;
  }

  // =========================================================================
  // Escape to close modals
  // =========================================================================

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
      } else if (!diffModal.classList.contains('hidden')) {
        diffModal.classList.add('hidden');
      } else if (!historyMenu.classList.contains('hidden')) {
        historyMenu.classList.add('hidden');
      } else if (!presetMenu.classList.contains('hidden')) {
        presetMenu.classList.add('hidden');
      }
    }
  });

  // =========================================================================
  // Toast notifications
  // =========================================================================

  function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAndFormat(text) {
    // Escape HTML, then convert markdown-like formatting
    let html = escapeHtml(text);

    // Code blocks: ```...```
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code: `...`
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold: **...**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Newlines
    html = html.replace(/\n/g, '<br>');

    return html;
  }
});
