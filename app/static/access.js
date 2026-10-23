const form = document.querySelector('#access-form');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const nameInput = document.querySelector('#name');
const password = document.querySelector('#password');
const confirmation = document.querySelector('#confirm');
const feedback = document.querySelector('.feedback');
const submit = form.querySelector('[type="submit"]');
let mode = 'login';

function setError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  error.textContent = message;
  error.hidden = !message;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function showFeedback(message) {
  feedback.textContent = message;
  feedback.hidden = false;
}

function updateReveal(button, visible) {
  const isConfirmation = button.getAttribute('aria-controls') === 'confirm';
  button.textContent = visible ? 'Ocultar' : 'Mostrar';
  button.setAttribute('aria-pressed', String(visible));
  button.setAttribute('aria-label', `${visible ? 'Ocultar' : 'Mostrar'} ${isConfirmation ? 'confirmação de senha' : 'senha'}`);
}

function changeMode(nextMode) {
  mode = nextMode;
  const signup = mode === 'signup';
  document.querySelector('.access-content').classList.toggle('signup-view', signup);
  modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  document.querySelector('#title').innerHTML = signup ? 'Sua aventura <span>começa aqui!</span>' : 'Vamos <span>nessa?</span>';
  document.querySelector('#subtitle').textContent = signup ? 'Crie sua conta e venha descobrir com a gente.' : 'Entre para continuar sua aventura.';
  document.querySelector('#submit-label').textContent = signup ? 'Criar minha conta' : 'Entrar na aventura';
  document.querySelector('#switch-prompt').textContent = signup ? 'Já faz parte da turma?' : 'É sua primeira aventura?';
  document.querySelector('#switch-link').textContent = signup ? 'Entre na aventura!' : 'Crie sua conta!';
  document.querySelector('#confirm-field').hidden = !signup;
  document.querySelector('#password-help').hidden = !signup;
  confirmation.disabled = !signup;
  confirmation.required = signup;
  password.autocomplete = signup ? 'new-password' : 'current-password';
  form.setAttribute('aria-label', signup ? 'Criar conta' : 'Entrar');
  document.title = `${signup ? 'Criar conta' : 'Entrar na aventura'} - Matemática Descomplicada`;
  [nameInput, password, confirmation].forEach(input => setError(input, ''));
  [password, confirmation].forEach(input => { input.value = ''; input.type = 'password'; });
  document.querySelectorAll('.reveal').forEach(button => updateReveal(button, false));
  feedback.hidden = true;
}

modeButtons.forEach(button => button.addEventListener('click', () => {
  if (button.dataset.mode !== mode) changeMode(button.dataset.mode);
}));
document.querySelector('#switch-link').addEventListener('click', () => {
  changeMode(mode === 'login' ? 'signup' : 'login');
  modeButtons.find(button => button.dataset.mode === mode).focus();
});
document.querySelectorAll('.reveal').forEach(button => button.addEventListener('click', () => {
  const input = document.getElementById(button.getAttribute('aria-controls'));
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  updateReveal(button, visible);
}));
[nameInput, password, confirmation].forEach(input => input.addEventListener('input', () => {
  setError(input, '');
  if (input === password) setError(confirmation, '');
  feedback.hidden = true;
}));

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;
  feedback.hidden = true;
  const name = mode === 'signup' ? nameInput.value.trim() : nameInput.value;
  const nameLength = Array.from(name).length;
  setError(nameInput, nameLength < 3 || nameLength > 30 ? 'Escolha um nome com 3 a 30 caracteres.' : '');
  let passwordError = !password.value ? 'Digite sua senha para continuar.' : '';
  if (mode === 'signup' && !passwordError) {
    if (Array.from(password.value).length < 6) passwordError = 'Sua senha precisa ter pelo menos 6 caracteres.';
    else if (new TextEncoder().encode(password.value).length > 72) passwordError = 'Escolha uma senha um pouco menor.';
  }
  setError(password, passwordError);
  setError(confirmation, mode !== 'signup' ? '' : !confirmation.value ? 'Repita sua senha aqui também.' : password.value !== confirmation.value ? 'As senhas estão diferentes. Vamos tentar de novo?' : '');
  const invalid = form.querySelector('[aria-invalid="true"]');
  if (invalid) { invalid.focus(); return; }

  submit.disabled = true;
  try {
    const signup = mode === 'signup';
    const response = await fetch(signup ? '/api/cadastro' : '/api/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: name, senha: password.value }),
    });
    if (!response.ok) {
      if (response.status === 409) setError(nameInput, 'Esse nome já está em uso. Escolha outro!');
      else if (response.status === 401) showFeedback('Nome ou senha não conferem. Vamos tentar de novo?');
      else if (response.status === 422) showFeedback('Confira seu nome e sua senha e tente novamente.');
      else showFeedback('Não conseguimos entrar agora. Tente novamente em instantes.');
      if (response.status === 409) nameInput.focus();
      return;
    }
    password.value = '';
    confirmation.value = '';
    if (signup) {
      changeMode('login');
      showFeedback('Conta criada! Agora entre para começar a aventura.');
    } else {
      sessionStorage.removeItem('matematica-descomplicada-partida');
      window.location.assign('dashboard.html');
    }
  } catch {
    showFeedback('Sem conexão no momento. Confira a internet e tente de novo.');
  } finally {
    submit.disabled = false;
  }
});
