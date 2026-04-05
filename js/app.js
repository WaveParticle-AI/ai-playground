/**
 * AI Playground — main application logic.
 */
document.addEventListener('DOMContentLoaded', () => {

  const registry = Providers.registry;
  let panelCount = 2; // start with 2 panels

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

  userPromptEl.addEventListener('input', updatePromptCount);

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

  async function sendToAll() {
    const userPrompt = document.getElementById('userPrompt').value.trim();
    if (!userPrompt) return;

    // Save to history
    saveToHistory(userPrompt);

    const systemPrompt = document.getElementById('systemPrompt').value.trim();
    const temperature = parseFloat(tempSlider.value);
    const maxTokens = parseInt(document.getElementById('maxTokens').value) || 1024;

    const panels = document.querySelectorAll('.response-panel');

    // Fire all panels in parallel
    const promises = Array.from(panels).map(async (panel) => {
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

      // Loading state
      bodyEl.innerHTML = '<div class="loading"><div class="spinner"></div><span>Generating...</span></div>';
      statusEl.textContent = '';
      statusEl.className = 'panel-status';
      footerEl.classList.add('hidden');

      const startTime = performance.now();

      try {
        const result = await Providers.generate(providerId, modelId, [
          { role: 'user', content: userPrompt }
        ], { systemPrompt, temperature, maxTokens });

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
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        bodyEl.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
        statusEl.textContent = `Failed after ${elapsed}s`;
        statusEl.className = 'panel-status status-error';
      }
    });

    await Promise.allSettled(promises);

    // Render response time comparison bars
    renderTimeBars();
  }

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
      <div class="panel-footer hidden" data-index="${idx}">
        <span class="token-info" data-index="${idx}"></span>
        <button class="btn-ghost btn-sm copy-response" data-index="${idx}">Copy</button>
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
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
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
  });

  document.getElementById('copyPromptBtn').addEventListener('click', () => {
    const text = document.getElementById('userPrompt').value;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copyPromptBtn');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy Prompt'; }, 1500);
    });
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
