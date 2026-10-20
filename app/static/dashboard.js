const dashboardMessage = document.querySelector('.motivation');

document.querySelectorAll('.play-now, .card-play').forEach(button => {
  button.addEventListener('click', () => {
    window.location.href = 'exercises.html';
  });
});

document.querySelectorAll('.card-progress, .card-awards').forEach(button => {
  button.addEventListener('click', () => {
    dashboardMessage.textContent = '✦ Em breve teremos novas aventuras! ✦';
  });
});
