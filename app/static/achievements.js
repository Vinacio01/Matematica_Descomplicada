(() => {
  const milestones = [
    { code: 'bronze', card: 'bronze', label: 'Bronze', streak: 5 },
    { code: 'prata', card: 'silver', label: 'Prata', streak: 10 },
    { code: 'ouro', card: 'gold', label: 'Ouro', streak: 20 },
    { code: 'trofeu', card: 'trophy', label: 'Troféu', streak: 50 },
  ];
  const cards = new Map(milestones.map(milestone => [
    milestone.code, document.querySelector(`[data-achievement="${milestone.card}"]`),
  ]));
  const grid = document.querySelector('.achievement-grid');
  const meter = document.querySelector('.unlock-meter');
  const count = document.getElementById('unlocked-count');
  const title = document.getElementById('detail-title');
  const description = document.getElementById('detail-description');
  const retry = document.getElementById('achievements-retry');
  const playLink = document.querySelector('.achievements-next');
  let unlocked = new Set();
  let currentStreak = 0;
  let nextMilestone = null;
  let requestId = 0;
  let controller = null;

  function clearView(message) {
    unlocked = new Set();
    grid.inert = true;
    count.textContent = message;
    meter.setAttribute('aria-valuenow', '0');
    Array.from(meter.children).forEach(step => step.classList.remove('is-filled'));
    cards.forEach(card => {
      card.classList.remove('is-unlocked', 'is-locked', 'is-next', 'is-selected');
      card.querySelector('.award-state').textContent = 'Aguarde...';
      card.querySelector('.award-select').setAttribute('aria-pressed', 'false');
    });
    title.textContent = message;
    description.textContent = '';
  }

  function selectAchievement(milestone) {
    const achieved = unlocked.has(milestone.code);
    const isNext = milestone.code === nextMilestone?.code;
    cards.forEach(card => {
      const selected = card === cards.get(milestone.code);
      card.classList.toggle('is-selected', selected);
      card.querySelector('.award-select').setAttribute('aria-pressed', String(selected));
    });
    title.textContent = `${milestone.label} · ${achieved ? 'Conquistada!' : isNext ? 'Próxima meta' : 'Bloqueada'}`;
    description.textContent = achieved
      ? nextMilestone ? `Objetivo de ${milestone.streak} acertos consecutivos alcançado! Essa conquista já é sua.`
        : `Objetivo de ${milestone.streak} acertos consecutivos alcançado! Coleção completa: todas as medalhas e o troféu são seus!`
      : isNext
        ? `Objetivo: ${milestone.streak} acertos consecutivos. Faltam ${Math.max(0, milestone.streak - currentStreak)} nesta tentativa! Vamos jogar?`
        : `Objetivo: ${milestone.streak} acertos consecutivos. Continue jogando para desbloquear!`;
  }

  function render(achievements, progress) {
    if (!Array.isArray(achievements) || !Number.isSafeInteger(progress?.sequencia_atual) ||
        progress.sequencia_atual < 0) throw new Error('invalid achievements');
    unlocked = new Set(achievements.map(item => item.codigo));
    currentStreak = progress.sequencia_atual;
    nextMilestone = milestones.find(milestone => !unlocked.has(milestone.code)) ?? null;
    playLink.textContent = nextMilestone ? 'Conquistar próxima medalha' : 'Continuar jogando';
    const unlockedCount = milestones.filter(milestone => unlocked.has(milestone.code)).length;
    count.textContent = `${unlockedCount} de ${milestones.length} desbloqueadas`;
    meter.setAttribute('aria-valuenow', String(unlockedCount));
    Array.from(meter.children).forEach((step, index) => {
      step.classList.toggle('is-filled', index < unlockedCount);
    });
    milestones.forEach(milestone => {
      const card = cards.get(milestone.code);
      const achieved = unlocked.has(milestone.code);
      const isNext = milestone.code === nextMilestone?.code;
      card.classList.toggle('is-unlocked', achieved);
      card.classList.toggle('is-locked', !achieved);
      card.classList.toggle('is-next', isNext);
      card.querySelector('.award-state').textContent = achieved
        ? '✓ Conquistada!' : isNext ? '★ Próxima meta' : '🔒 Bloqueada';
      card.querySelector('.award-select').setAttribute('aria-label',
        `${milestone.label}: ${milestone.streak} acertos consecutivos, ${achieved ? 'conquistada' : 'bloqueada'}. Selecionar detalhes.`);
    });
    grid.inert = false;
    selectAchievement(nextMilestone ?? milestones[milestones.length - 1]);
  }

  async function loadAchievements() {
    controller?.abort();
    controller = new AbortController();
    const currentRequest = ++requestId;
    grid.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    clearView('Buscando suas conquistas...');
    try {
      const responses = await Promise.all(['/api/conquistas', '/api/progresso'].map(url =>
        fetch(url, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })));
      if (currentRequest !== requestId) return;
      if (responses.some(response => response.status === 401)) {
        window.location.replace('access.html');
        return;
      }
      if (responses.some(response => !response.ok)) throw new Error('achievements unavailable');
      const [achievements, progress] = await Promise.all(responses.map(response => response.json()));
      if (currentRequest !== requestId) return;
      render(achievements, progress);
    } catch (error) {
      if (currentRequest !== requestId || error.name === 'AbortError') return;
      clearView('Não conseguimos buscar suas medalhas. Vamos tentar de novo?');
      count.textContent = 'Conquistas indisponíveis';
      retry.hidden = false;
    } finally {
      if (currentRequest === requestId) grid.setAttribute('aria-busy', 'false');
    }
  }

  milestones.forEach(milestone => {
    cards.get(milestone.code).querySelector('.award-select').addEventListener('click', () => {
      selectAchievement(milestone);
    });
  });
  retry.addEventListener('click', () => window.checkSession());
  window.addEventListener('auth:ready', loadAchievements);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    controller?.abort();
    requestId += 1;
    grid.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    clearView('Buscando suas conquistas...');
  });
})();
