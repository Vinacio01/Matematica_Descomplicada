document.querySelectorAll('.play-now, .card-play').forEach(button => {
  button.addEventListener('click', () => {
    window.location.href = 'game-modes.html';
  });
});

document.querySelector('.card-progress').addEventListener('click', () => {
  window.location.href = 'progress.html';
});

document.querySelectorAll('.card-awards').forEach(button => {
  button.addEventListener('click', () => {
    window.location.href = 'achievements.html';
  });
});

window.addEventListener('auth:ready', event => {
  document.querySelector('.motivation').textContent = `✦ Que bom ter você aqui, ${event.detail.nome}! ✦`;
});

document.querySelector('#logout-button').addEventListener('click', async event => {
  event.preventDefault();
  const button = event.currentTarget;
  if (button.dataset.busy) return;
  button.dataset.busy = 'true';
  try {
    const response = await window.authenticatedPost('/api/logout');
    if (!response.ok) throw new Error('logout failed');
    sessionStorage.removeItem('matematica-descomplicada-partida');
    window.location.replace('index.html');
  } catch {
    document.querySelector('.motivation').textContent = 'Não conseguimos sair agora. Tente novamente.';
    delete button.dataset.busy;
  }
});
