// A sessão é verificada pelo servidor ao servir o HTML e novamente aqui para
// detectar logout ou expiração enquanto a página permanece aberta.
function checkSession() {
  return fetch('/api/eu', { credentials: 'same-origin', cache: 'no-store' })
  .then(response => {
    if (response.status === 401) {
      window.location.replace('access.html');
      return null;
    }
    if (!response.ok) throw new Error('session unavailable');
    return response.json();
  })
  .then(user => {
    if (user) window.dispatchEvent(new CustomEvent('auth:ready', { detail: user }));
  })
  .catch(() => {
    document.querySelector('main').inert = true;
    const status = document.createElement('p');
    status.setAttribute('role', 'alert');
    status.textContent = 'Não conseguimos confirmar sua sessão. Recarregue a página para tentar de novo.';
    status.style.cssText = 'position:fixed;z-index:1000;inset:auto 1rem 1rem;background:#321557;color:#fff5db;padding:1rem;border-radius:1rem;text-align:center;font:800 18px Nunito,sans-serif';
    document.body.append(status);
  });
}

window.authenticatedPost = async (url, body) => {
  const csrfResponse = await fetch('/api/csrf', { credentials: 'same-origin', cache: 'no-store' });
  if (csrfResponse.status === 401) {
    window.location.replace('access.html');
    throw new Error('session expired');
  }
  if (!csrfResponse.ok) throw new Error('session unavailable');
  const { csrf_token: csrfToken } = await csrfResponse.json();
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'X-CSRF-Token': csrfToken,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 401) window.location.replace('access.html');
  return response;
};

checkSession();
window.addEventListener('pageshow', event => {
  if (event.persisted) checkSession();
});
