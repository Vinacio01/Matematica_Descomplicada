const form = document.querySelector('#access-form');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const nameInput = document.querySelector('#name');
const password = document.querySelector('#password');
const confirmation = document.querySelector('#confirm');
const feedback = document.querySelector('.feedback');
let mode = 'login';

function setError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  error.textContent = message;
  error.hidden = !message;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
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
  document.title = `${signup ? 'Criar conta' : 'Entrar na aventura'} — Matemática Descomplicada`;
  [nameInput, password, confirmation].forEach(input => setError(input, ''));
  [password, confirmation].forEach(input => { input.value = ''; input.type = 'password'; });
  document.querySelectorAll('.reveal').forEach(button => updateReveal(button, false));
  feedback.hidden = true;
}

function updateReveal(button, visible) {
  const confirmationButton = button.getAttribute('aria-controls') === 'confirm';
  button.textContent = visible ? 'Ocultar' : 'Mostrar';
  button.setAttribute('aria-pressed', String(visible));
  button.setAttribute('aria-label', `${visible ? 'Ocultar' : 'Mostrar'} ${confirmationButton ? 'confirmação de senha' : 'senha'}`);
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
form.addEventListener('submit', event => {
  event.preventDefault();
  feedback.hidden = true;
  setError(nameInput, nameInput.value.trim() ? '' : 'Conte para a gente o seu nome.');
  setError(password, !password.value ? 'Digite sua senha para continuar.' : mode === 'signup' && password.value.length < 6 ? 'Sua senha precisa ter pelo menos 6 caracteres.' : '');
  setError(confirmation, mode !== 'signup' ? '' : !confirmation.value ? 'Repita sua senha aqui também.' : password.value !== confirmation.value ? 'As senhas estão diferentes. Vamos tentar de novo?' : '');
  const invalid = form.querySelector('[aria-invalid="true"]');
  if (invalid) { invalid.focus(); return; }
  password.value = '';
  confirmation.value = '';
  if (mode === 'signup') {
    changeMode('login');
    feedback.textContent = 'Cadastro demonstrativo concluído! Nenhuma conta foi criada. Entre para continuar.';
    feedback.hidden = false;
    return;
  }
  window.location.href = 'dashboard.html';
});
