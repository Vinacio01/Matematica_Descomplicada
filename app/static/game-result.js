(() => {
  const state = window.MathGame.read();
  if (!state || state.mode !== 'adventure' || !state.result) {
    window.location.replace('game-modes.html');
    return;
  }

  const { correct, errors, stars } = state.result;
  const resultSignature = JSON.stringify(state.result);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    const current = window.MathGame.read();
    if (!current?.result) window.location.replace('game-modes.html');
    else if (JSON.stringify(current.result) !== resultSignature) window.location.reload();
  });
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-errors').textContent = errors;
  const starsElement = document.getElementById('result-stars');
  starsElement.setAttribute('aria-label', `${stars} de 3 estrelas conquistadas`);
  for (let index = 0; index < 3; index++) {
    const star = document.createElement('span');
    star.textContent = index < stars ? '★' : '☆';
    star.setAttribute('aria-hidden', 'true');
    if (index < stars) star.classList.add('earned');
    starsElement.append(star);
  }
  const messages = [
    'Você chegou até o fim! Cada tentativa faz você crescer. Vamos de novo?',
    'Muito bem! Sua aventura está só começando!',
    'Que conquista! Você brilhou nesta aventura!',
    'Incrível! Você acertou todos os desafios!'
  ];
  document.getElementById('result-message').textContent = messages[stars];
  document.getElementById('replay-button').addEventListener('click', () => {
    window.MathGame.start('adventure');
    window.location.href = 'exercises.html?mode=adventure';
  });
})();
