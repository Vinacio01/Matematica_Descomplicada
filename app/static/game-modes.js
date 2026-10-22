document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    window.MathGame.start(mode);
    window.location.href = `exercises.html?mode=${mode}`;
  });
});
