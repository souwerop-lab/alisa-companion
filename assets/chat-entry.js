(function () {
  'use strict';

  const scripts = document.currentScript.dataset;
  const query = new URLSearchParams(location.search);
  const status = document.getElementById('chat-unavailable');
  const base = (document.querySelector('meta[name="alisa-api"]')?.content.trim() || '/api').replace(/\/+$/, '');

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }

  async function start() {
    let enabled = false;
    try {
      const response = await fetch(base + '/session?status=1', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      enabled = response.ok && (await response.json()).chatEnabled === true;
    } catch { /* Keep the chat closed if its status is unavailable. */ }

    const debug = query.get('debug') === '1';
    window.alisaChatDataOnly = !enabled && !debug;
    if (!window.alisaChatDataOnly) {
      await loadScript(scripts.gate);
      status.hidden = true;
      if (!window.alisaAgeAllowed()) return;
      // Debug stays usable when the server cannot generate replies.
      window.alisaChatPreview = !enabled;
      await loadScript(scripts.motion);
    }
    await loadScript(scripts.chat);
  }

  void start().catch(() => { status.hidden = false; });
})();
