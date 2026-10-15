"use strict";

// Prévia independente: nenhuma chamada de rede, sessão ou persistência.
// Integração futura: manter fetch em uma camada própria e entregar os dados
// às funções de apresentação. Os exemplos abaixo nunca são respostas da API.
(() => {
  const screens = [...document.querySelectorAll(".screen")];
  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const titles = {
    "boas-vindas": "Aprender é uma aventura",
    cadastro: "Cadastro", login: "Login", painel: "Meu espaço",
    exercicios: "Exercícios", progresso: "Meu progresso", conquistas: "Conquistas"
  };

  function showScreen() {
    const requested = window.location.hash.slice(1) || "boas-vindas";
    // O link de acessibilidade é uma âncora de conteúdo, não uma tela.
    if (requested === "conteudo") {
      document.querySelector("main").focus();
      return;
    }
    const screenId = Object.hasOwn(titles, requested) ? requested : "boas-vindas";
    screens.forEach(screen => { screen.hidden = screen.id !== screenId; });
    navLinks.forEach(link => {
      if (link.dataset.nav === screenId) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.title = `${titles[screenId]} • Matemática Descomplicada`;
    document.getElementById(`titulo-${screenId}`).focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // A validação nativa complementa as mensagens específicas de cada formulário.
  const registration = document.getElementById("cadastro-form");
  const name = document.getElementById("cadastro-nome");
  const password = document.getElementById("cadastro-senha");
  const confirmation = document.getElementById("cadastro-confirmacao");

  function validateRegistration() {
    name.setCustomValidity(name.value.trim().length < 3 ? "Digite um nome com pelo menos 3 caracteres, além dos espaços." : "");
    password.setCustomValidity(new TextEncoder().encode(password.value).length > 72 ? "Esta senha de exemplo é longa demais. Use até 72 bytes; acentos e emojis podem ocupar mais de um byte." : "");
    confirmation.setCustomValidity(confirmation.value !== password.value ? "As senhas precisam ser iguais. Vamos conferir?" : "");
  }
  registration.addEventListener("input", () => {
    validateRegistration();
    document.getElementById("cadastro-feedback").textContent = "";
  });
  registration.addEventListener("submit", event => {
    event.preventDefault();
    validateRegistration();
    if (!registration.reportValidity()) return;
    document.getElementById("cadastro-feedback").textContent = "Campos conferidos! Esta é apenas uma prévia: nenhuma conta foi criada. Você pode conhecer o painel pelo menu Meu espaço.";
    password.value = "";
    confirmation.value = "";
  });

  const login = document.getElementById("login-form");
  login.addEventListener("submit", event => {
    event.preventDefault();
    document.getElementById("login-feedback").textContent = "O login ainda não está conectado. Nenhum dado foi enviado. Use “Explorar o painel de exemplo” para conhecer as telas.";
    document.getElementById("login-senha").value = "";
  });
  login.addEventListener("input", () => { document.getElementById("login-feedback").textContent = ""; });

  const visualExamples = [
    { label: "Adição", statement: "8 + 4", hint: "O sinal + indica uma adição: pense em juntar quantidades." },
    { label: "Subtração", statement: "12 − 5", hint: "O sinal − indica uma subtração: pense na quantidade que sobra ao retirar uma parte." },
    { label: "Multiplicação", statement: "3 × 4", hint: "O sinal × indica uma multiplicação: imagine grupos com a mesma quantidade." },
    { label: "Divisão", statement: "20 ÷ 5", hint: "O sinal ÷ indica uma divisão: imagine repartir em grupos iguais." }
  ];
  let exampleIndex = 0;
  const exercise = document.getElementById("exercicio-form");
  const exerciseFeedback = document.getElementById("exercicio-feedback");
  const hintToggle = document.getElementById("dica-toggle");
  const hint = document.getElementById("dica-texto");

  function renderExample() {
    const example = visualExamples[exampleIndex];
    document.getElementById("operacao-label").textContent = example.label;
    const equation = document.getElementById("enunciado");
    const suffix = document.createElement("span");
    suffix.textContent = " = ?";
    suffix.setAttribute("aria-hidden", "true");
    equation.replaceChildren(document.createTextNode(example.statement), suffix);
    document.getElementById("exemplo-contador").textContent = `Exemplo ${exampleIndex + 1} de ${visualExamples.length}`;
    hint.textContent = example.hint;
    hint.hidden = true;
    hintToggle.setAttribute("aria-expanded", "false");
    hintToggle.textContent = "Mostrar dica visual +";
    exercise.reset();
    exerciseFeedback.textContent = "";
  }
  document.getElementById("outro-exemplo").addEventListener("click", () => {
    exampleIndex = (exampleIndex + 1) % visualExamples.length;
    renderExample();
  });
  exercise.addEventListener("submit", event => {
    event.preventDefault();
    exerciseFeedback.textContent = "Aqui aparecerá o resultado quando o jogo estiver conectado. Nesta prévia, sua resposta não foi corrigida nem registrada.";
  });
  exercise.addEventListener("input", () => { exerciseFeedback.textContent = ""; });
  hintToggle.addEventListener("click", () => {
    hint.hidden = !hint.hidden;
    hintToggle.setAttribute("aria-expanded", String(!hint.hidden));
    hintToggle.textContent = hint.hidden ? "Mostrar dica visual +" : "Esconder dica −";
  });

  // Limpa senhas de demonstração ao sair de uma tela, inclusive pelo histórico.
  window.addEventListener("hashchange", () => {
    document.querySelectorAll('input[type="password"]').forEach(input => {
      input.value = "";
      input.setCustomValidity("");
    });
    showScreen();
  });
  showScreen();
})();
