(() => {
  const grid = document.querySelector('.progress-grid');
  const message = document.getElementById('progress-message');
  const retry = document.getElementById('progress-retry');
  const indicators = {
    acertos: document.getElementById('correct-count'),
    erros: document.getElementById('mistake-count'),
    sequencia_atual: document.getElementById('streak-count'),
    recorde: document.getElementById('record-count'),
  };
  const total = document.getElementById('total-count');
  const accuracy = document.getElementById('accuracy-count');
  let requestId = 0;
  let controller = null;

  function clearIndicators() {
    Object.values(indicators).forEach(element => { element.textContent = '—'; });
    total.textContent = '—';
    accuracy.textContent = '—';
  }

  function render(progress) {
    for (const field of Object.keys(indicators)) {
      if (!Number.isSafeInteger(progress[field]) || progress[field] < 0) {
        throw new Error('invalid progress');
      }
    }
    for (const [field, element] of Object.entries(indicators)) {
      element.textContent = String(progress[field]);
    }
    const answered = progress.acertos + progress.erros;
    total.textContent = String(answered);
    accuracy.textContent = `${answered ? Math.round(progress.acertos * 100 / answered) : 0}%`;
    message.textContent = answered
      ? 'Cada desafio é um passo na sua aventura!'
      : 'Sua aventura está começando! Que tal jogar seu primeiro desafio?';
  }

  async function loadProgress() {
    controller?.abort();
    controller = new AbortController();
    const currentRequest = ++requestId;
    clearIndicators();
    grid.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    message.textContent = 'Buscando suas conquistas...';
    try {
      const response = await fetch('/api/progresso', {
        credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
      });
      if (currentRequest !== requestId) return;
      if (response.status === 401) {
        window.location.replace('access.html');
        return;
      }
      if (!response.ok) throw new Error('progress unavailable');
      const progress = await response.json();
      if (currentRequest !== requestId) return;
      render(progress);
    } catch (error) {
      if (currentRequest !== requestId || error.name === 'AbortError') return;
      clearIndicators();
      message.textContent = 'Ops! Não conseguimos buscar suas conquistas. Vamos tentar de novo?';
      retry.hidden = false;
    } finally {
      if (currentRequest === requestId) grid.setAttribute('aria-busy', 'false');
    }
  }

  window.addEventListener('auth:ready', loadProgress);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    controller?.abort();
    requestId += 1;
    clearIndicators();
    grid.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    message.textContent = 'Buscando suas conquistas...';
  });
  retry.addEventListener('click', () => window.checkSession());
})();
