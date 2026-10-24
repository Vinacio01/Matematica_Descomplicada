(() => {
  const operationElement = document.getElementById('operation');
  const promptElement = document.getElementById('exercise-prompt');
  const typedForm = document.getElementById('typed-form');
  const typedAnswer = document.getElementById('typed-answer');
  const choicesArea = document.getElementById('choices-area');
  const choicesElement = document.getElementById('choices');
  const feedback = document.getElementById('feedback');
  const nextButton = document.getElementById('next-button');
  const missionBoard = document.querySelector('.mission-board');
  const turquoiseMascot = document.getElementById('mascot-turquoise');
  const coralMascot = document.getElementById('mascot-coral');
  const adventureProgress = document.getElementById('adventure-progress');
  const challengeCount = document.getElementById('challenge-count');
  const progressTrack = document.querySelector('.progress-track');
  const progressFill = document.getElementById('progress-fill');
  const main = document.querySelector('main');
  const keyboardIntro = document.getElementById('keyboard-intro');
  const keyboardIntroButton = document.getElementById('keyboard-intro-button');
  const mode = new URLSearchParams(window.location.search).get('mode') === 'adventure' ? 'adventure' : 'free';
  let state = window.MathGame.read();
  if (mode === 'adventure' && (!state || state.mode !== 'adventure')) {
    window.location.replace('game-modes.html');
    return;
  }
  if (mode === 'adventure' && state.result) {
    window.location.replace('game-result.html');
    return;
  }
  if (mode === 'free' && (!state || state.mode !== 'free')) state = window.MathGame.start('free');
  document.querySelector('.exercises-world').classList.toggle('adventure-world', mode === 'adventure');
  document.getElementById('mode-tag').textContent = mode === 'adventure' ? '✦ Modo Aventura ✦' : '✦ Treino Livre ✦';
  adventureProgress.hidden = mode !== 'adventure';
  const turquoisePoses = [
    { file: 'mascot-turquoise-thinking.svg', alt: 'Mascote turquesa pensativo, com a mão no queixo.' },
    { file: 'mascot-turquoise-pencil.svg', alt: 'Mascote turquesa concentrado, desenhando com um lápis.' },
    { file: 'mascot-turquoise-puzzled.svg', alt: 'Mascote turquesa abre os braços, curioso sobre a conta.' }
  ];
  const coralPoses = [
    { file: 'mascot-coral-thinking.svg', alt: 'Mascote coral pensa enquanto coça a cabeça.' },
    { file: 'mascot-coral-curious.svg', alt: 'Mascote coral observa a pergunta com curiosidade.' },
    { file: 'mascot-coral-concentrating.svg', alt: 'Mascote coral se concentra em um bloquinho de contas.' }
  ];
  let currentQuestion = null;
  let answerLocked = false;
  let submissionInFlight = false;
  let lastMascotCombination = '';
  let questionNumber = 0;
  let focusFirstChoiceAfterNotice = false;
  let mainWasInert = false;

  function showKeyboardIntro() {
    mainWasInert = main.inert;
    main.inert = true;
    keyboardIntro.hidden = false;
    keyboardIntroButton.focus({ preventScroll: true });
  }

  function closeKeyboardIntro() {
    if (keyboardIntro.hidden) return;
    keyboardIntro.hidden = true;
    main.inert = mainWasInert;
    state = window.MathGame.acknowledgeInstructions();
    focusFirstChoiceAfterNotice = true;
    startQuestion();
  }

  function updateAdventureProgress() {
    if (mode !== 'adventure') return;
    state = window.MathGame.read();
    if (!state || state.result) {
      window.location.replace(state?.result ? 'game-result.html' : 'game-modes.html');
      return false;
    }
    questionNumber = state.answered + 1;
    challengeCount.textContent = `Desafio ${questionNumber} de ${window.MathGame.limit}`;
    progressTrack.setAttribute('aria-valuenow', String(state.answered));
    progressFill.style.width = `${state.answered * 100 / window.MathGame.limit}%`;
    return true;
  }

  const randomInteger = (minimum, maximum) =>
    Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

  function changeMascots() {
    const casts = ['turquoise', 'coral', 'both'];
    const cast = casts[randomInteger(0, casts.length - 1)];
    const candidates = [];
    for (let turquoise = 0; turquoise < turquoisePoses.length; turquoise++) {
      for (let coral = 0; coral < coralPoses.length; coral++) {
        if (cast === 'turquoise' && coral > 0) continue;
        if (cast === 'coral' && turquoise > 0) continue;
        const key = `${cast}-${turquoise}-${coral}`;
        if (key !== lastMascotCombination) candidates.push({ key, turquoise, coral });
      }
    }
    const selection = candidates[randomInteger(0, candidates.length - 1)];
    lastMascotCombination = selection.key;
    missionBoard.dataset.cast = cast;
    turquoiseMascot.hidden = cast === 'coral';
    coralMascot.hidden = cast === 'turquoise';
    turquoiseMascot.src = `assets/${turquoisePoses[selection.turquoise].file}`;
    turquoiseMascot.alt = turquoisePoses[selection.turquoise].alt;
    coralMascot.src = `assets/${coralPoses[selection.coral].file}`;
    coralMascot.alt = coralPoses[selection.coral].alt;
  }

  async function getNextQuestion(format) {
    const url = `/api/questao?formato=${format}`;
    let response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) {
      window.location.replace('access.html');
      throw new Error('session expired');
    }
    if (response.status === 404) response = await window.authenticatedPost(url);
    if (!response.ok) throw new Error('question unavailable');
    return response.json();
  }

  async function submitAnswer(questionId, answer) {
    const response = await window.authenticatedPost('/api/responder', {
      questao_id: questionId, resposta: answer,
    });
    if (!response.ok) {
      const error = new Error('answer unavailable');
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  function showAction(label, action) {
    nextButton.innerHTML = `${label} <span aria-hidden="true">➜</span>`;
    nextButton.dataset.action = action;
    nextButton.disabled = false;
    nextButton.classList.add('is-visible');
    nextButton.focus();
  }

  function renderQuestion(question) {
    changeMascots();
    operationElement.textContent = `${question.enunciado.replace(' - ', ' − ')} = ?`;
    if (question.alternativas === null) {
      typedForm.hidden = false;
      promptElement.textContent = 'Digite a resposta:';
    } else {
      choicesArea.hidden = false;
      promptElement.textContent = 'Escolha a resposta:';
      question.alternativas.forEach((value, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice';
        button.dataset.value = String(value);
        button.setAttribute('aria-label', `Tecla ${index + 1}: resposta ${value}`);
        const badge = document.createElement('span');
        badge.className = 'choice-key';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = String(index + 1);
        const answer = document.createElement('span');
        answer.className = 'choice-value';
        answer.textContent = String(value);
        button.append(badge, answer);
        button.addEventListener('click', () => checkAnswer(value));
        choicesElement.append(button);
      });
    }
  }

  async function startQuestion() {
    if (mode === 'adventure' && !updateAdventureProgress()) return;
    answerLocked = true;
    typedAnswer.value = '';
    typedAnswer.disabled = false;
    typedForm.querySelector('button').disabled = false;
    choicesElement.replaceChildren();
    feedback.textContent = '';
    feedback.className = 'feedback';
    nextButton.disabled = true;
    nextButton.classList.remove('is-visible');
    delete nextButton.dataset.action;
    typedForm.hidden = true;
    choicesArea.hidden = true;
    operationElement.textContent = '';
    promptElement.textContent = 'Quanto é?';

    const pending = window.MathGame.read()?.pending;
    if (pending) {
      currentQuestion = pending.question;
      renderQuestion(currentQuestion);
      if (currentQuestion.alternativas === null) typedAnswer.value = String(pending.answer);
      typedAnswer.disabled = true;
      typedForm.querySelector('button').disabled = true;
      choicesElement.querySelectorAll('button').forEach(button => { button.disabled = true; });
      await sendPendingAnswer();
      return;
    }

    try {
      const format = Math.random() < 0.5 ? 'digitada' : 'alternativas';
      currentQuestion = await getNextQuestion(format);
      renderQuestion(currentQuestion);
      answerLocked = false;
      if (currentQuestion.alternativas === null && !typedForm.hidden &&
          !typedAnswer.disabled && window.matchMedia('(pointer: fine)').matches) {
        typedAnswer.focus({ preventScroll: true });
      } else if (focusFirstChoiceAfterNotice && !choicesArea.hidden) {
        choicesElement.querySelector('button')?.focus({ preventScroll: true });
      }
      focusFirstChoiceAfterNotice = false;
    } catch {
      currentQuestion = null;
      feedback.textContent = 'Ops! Não conseguimos preparar o desafio. Tente novamente!';
      feedback.classList.add('error');
      showAction('Tentar novamente', 'load');
    }
  }

  async function sendPendingAnswer() {
    if (submissionInFlight) return;
    const pending = window.MathGame.read()?.pending;
    if (!pending) return;
    submissionInFlight = true;
    nextButton.disabled = true;
    try {
      const result = await submitAnswer(pending.question.id, pending.answer);
      if (mode === 'adventure') {
        state = window.MathGame.record(result.correta, questionNumber, pending.question.id);
        if (!state) {
          window.location.reload();
          return;
        }
        progressTrack.setAttribute('aria-valuenow', String(state.answered));
        progressFill.style.width = `${state.answered * 100 / window.MathGame.limit}%`;
      } else {
        state = window.MathGame.clearPending(pending.question.id);
        if (!state) {
          window.location.reload();
          return;
        }
      }
      const selected = [...choicesElement.querySelectorAll('button')]
        .find(button => Number(button.dataset.value) === pending.answer);
      if (result.correta) {
        feedback.textContent = 'Muito bem! Você acertou! ✦';
        feedback.className = 'feedback success';
        selected?.classList.add('is-correct');
      } else {
        feedback.textContent = state.result ? 'Quase! Você concluiu a aventura!' : 'Quase! Vamos ao próximo?';
        feedback.className = 'feedback error';
        selected?.classList.add('is-wrong');
      }
      showAction(state.result ? 'Ver resultado' : 'Próximo desafio', state.result ? 'result' : 'next');
    } catch (error) {
      feedback.className = 'feedback error';
      if (error.status === 409) {
        feedback.textContent = 'Este desafio já foi respondido em outra aba. Escolha um modo para começar de novo.';
        showAction('Escolher modo', 'conflict');
      } else {
        feedback.textContent = 'Não conseguimos confirmar a resposta. Tente enviar novamente.';
        showAction('Tentar novamente', 'retry');
      }
    } finally {
      submissionInFlight = false;
    }
  }

  function checkAnswer(answer) {
    if (answerLocked || !currentQuestion) return;
    if (!window.MathGame.setPending(currentQuestion, answer)) {
      window.location.reload();
      return;
    }
    answerLocked = true;
    typedAnswer.disabled = true;
    typedForm.querySelector('button').disabled = true;
    choicesElement.querySelectorAll('button').forEach(button => { button.disabled = true; });
    sendPendingAnswer();
  }

  typedForm.addEventListener('submit', event => {
    event.preventDefault();
    if (answerLocked) return;
    const raw = typedAnswer.value.trim();
    if (!/^-?\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
      feedback.textContent = 'Digite um número inteiro para continuar!';
      feedback.className = 'feedback error';
      typedAnswer.focus({ preventScroll: true });
      return;
    }
    checkAnswer(Number(raw));
  });

  keyboardIntroButton.addEventListener('click', closeKeyboardIntro);
  document.addEventListener('keydown', event => {
    if (!keyboardIntro.hidden) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeKeyboardIntro();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        keyboardIntroButton.focus({ preventScroll: true });
      } else if (/^[1-4]$/.test(event.key)) {
        event.preventDefault();
      }
      return;
    }
    if (event.repeat || event.isComposing || event.altKey || event.ctrlKey ||
        event.metaKey || event.shiftKey || answerLocked || submissionInFlight ||
        !currentQuestion || currentQuestion.alternativas === null || choicesArea.hidden ||
        !/^[1-4]$/.test(event.key) ||
        (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]'))) return;
    const match = /^(?:Digit|Numpad)([1-4])$/.exec(event.code);
    if (!match) return;
    const button = choicesElement.querySelectorAll('button')[Number(match[1]) - 1];
    if (!button || button.disabled) return;
    event.preventDefault();
    button.click();
  });

  nextButton.addEventListener('click', () => {
    if (nextButton.dataset.action === 'conflict') {
      window.location.href = 'game-modes.html';
    } else if (nextButton.dataset.action === 'retry') {
      sendPendingAnswer();
    } else if (mode === 'adventure' && window.MathGame.read()?.result) {
      window.location.href = 'game-result.html';
    } else {
      startQuestion();
    }
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted || mode !== 'adventure') return;
    const current = window.MathGame.read();
    if (current?.result) window.location.replace('game-result.html');
    else if (!current || current.answered !== questionNumber - 1) window.location.reload();
  });
  if (state?.instructionsSeen === false) showKeyboardIntro();
  else startQuestion();
})();
