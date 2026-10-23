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
