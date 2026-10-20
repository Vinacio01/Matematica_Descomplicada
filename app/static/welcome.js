const button = document.querySelector('.start');
const message = document.querySelector('.hint');
const celebration = document.querySelector('.celebration');
let timer;
button.addEventListener('click', () => {
  message.textContent = 'Oba! Nossa aventura está sendo preparada!';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.location.href = 'access.html';
    return;
  }
  clearTimeout(timer);
  celebration.replaceChildren();
  const colors = ['#FFB928', '#2BC9C5', '#FF705A', '#52DB78', '#FFF5DB'];
  for (let i = 0; i < 22; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.textContent = ['✦', '●', '+'][i % 3];
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 580}px`);
    piece.style.setProperty('--y', `${-70 - Math.random() * 280}px`);
    piece.style.setProperty('--spin', `${(Math.random() - 0.5) * 360}deg`);
    piece.style.setProperty('--color', colors[i % colors.length]);
    celebration.append(piece);
  }
  timer = setTimeout(() => celebration.replaceChildren(), 1100);
  setTimeout(() => { window.location.href = 'access.html'; }, 650);
});
