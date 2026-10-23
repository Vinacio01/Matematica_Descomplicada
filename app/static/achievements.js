// Estado local de demonstração; os marcos seguem as condições do back-end.
const demoCurrentStreak = 7;
const milestones = [
  { name: 'bronze', label: 'Bronze', streak: 5 },
  { name: 'silver', label: 'Prata', streak: 10 },
  { name: 'gold', label: 'Ouro', streak: 20 },
  { name: 'trophy', label: 'Troféu', streak: 50 }
];

const nextMilestone = milestones.find(({ streak }) => demoCurrentStreak < streak);
const cards = new Map();
let unlocked = 0;

milestones.forEach(({ name, label, streak }) => {
  const card = document.querySelector(`[data-achievement="${name}"]`);
  const achieved = demoCurrentStreak >= streak;
  const isNext = name === nextMilestone?.name;
  cards.set(name, card);
  card.classList.add(achieved ? 'is-unlocked' : 'is-locked');
  if (isNext) card.classList.add('is-next');
  card.querySelector('.award-state').textContent = achieved
    ? '✓ Conquistada!'
    : isNext ? '★ Próxima meta' : '🔒 Bloqueada';
  card.querySelector('.award-select').setAttribute(
    'aria-label',
    `${label}: ${streak} acertos consecutivos, ${achieved ? 'conquistada' : 'bloqueada'}. Selecionar detalhes.`
  );
  if (achieved) unlocked += 1;
});

document.querySelector('#unlocked-count').textContent = `${unlocked} de ${milestones.length} desbloqueadas`;
const meter = document.querySelector('.unlock-meter');
meter.setAttribute('aria-valuenow', String(unlocked));
Array.from(meter.children).forEach((step, index) => {
  step.classList.toggle('is-filled', index < unlocked);
});

function selectAchievement(milestone) {
  const achieved = demoCurrentStreak >= milestone.streak;
  const isNext = milestone.name === nextMilestone?.name;
  cards.forEach(card => {
    const selected = card.dataset.achievement === milestone.name;
    card.classList.toggle('is-selected', selected);
    card.querySelector('.award-select').setAttribute('aria-pressed', String(selected));
  });

  document.querySelector('#detail-title').textContent = `${milestone.label} · ${achieved ? 'Conquistada!' : isNext ? 'Próxima meta' : 'Bloqueada'}`;
  document.querySelector('#detail-description').textContent = achieved
    ? `Objetivo: ${milestone.streak} acertos consecutivos. Já conquistada na demonstração!`
    : isNext
      ? `Objetivo: ${milestone.streak} acertos consecutivos. Faltam ${milestone.streak - demoCurrentStreak} para chegar lá!`
      : `Objetivo: ${milestone.streak} acertos consecutivos. Continue jogando para desbloquear!`;
}

milestones.forEach(milestone => {
  cards.get(milestone.name).querySelector('.award-select').addEventListener('click', () => {
    selectAchievement(milestone);
  });
});

selectAchievement(nextMilestone ?? milestones[milestones.length - 1]);
