const dashboardMessage = document.querySelector('.motivation');

document.querySelectorAll('.play-now, .destination-card').forEach(button => {
  button.addEventListener('click', () => {
    dashboardMessage.textContent = '✦ Em breve teremos novas aventuras! ✦';
  });
});
