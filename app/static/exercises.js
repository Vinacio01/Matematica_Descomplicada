(() => {
  const operations = ['+', '−', '×', '÷'];
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
  let lastMascotCombination = '';
  let questionNumber = 0;

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

  // Demo source: replace this function with a normalized GET /api/questao response later.
  // The ranges and operations mirror the current question generator in app/jogo.py.
  function createLocalQuestion() {
    const operation = operations[randomInteger(0, operations.length - 1)];
    let first;
    let second;
    if (operation === '+' || operation === '−') {
      first = randomInteger(1, 50);
      second = randomInteger(1, 50);
      if (operation === '−' && first < second) [first, second] = [second, first];
    } else if (operation === '×') {
      first = randomInteger(1, 10);
      second = randomInteger(1, 10);
    } else {
      second = randomInteger(1, 10);
      first = second * randomInteger(1, 10);
    }
    return { first, second, operation, statement: `${first} ${operation} ${second}` };
  }

  // Used only to build demo alternatives and demo feedback. Future official validation
  // must use POST /api/responder with { questao_id, resposta } and its result.
  function calculateLocalAnswer(question) {
    switch (question.operation) {
      case '+': return question.first + question.second;
      case '−': return question.first - question.second;
      case '×': return question.first * question.second;
      default: return question.first / question.second;
    }
  }

  async function getNextQuestion() {
    return createLocalQuestion();
  }

  async function submitAnswer(question, answer) {
    return { correct: answer === calculateLocalAnswer(question) };
  }

  function shuffle(values) {
    for (let index = values.length - 1; index > 0; index--) {
      const other = randomInteger(0, index);
      [values[index], values[other]] = [values[other], values[index]];
    }
    return values;
  }

  function buildAlternatives(correct) {
    const alternatives = new Set([correct]);
    const nearby = correct <= 10
      ? [-3, -2, -1, 1, 2, 3, 4]
      : correct <= 30
        ? [-5, -3, -2, -1, 1, 2, 3, 5]
        : [-10, -5, -3, -2, -1, 1, 2, 3, 5, 10];
    const offsets = shuffle(nearby);
    for (const offset of offsets) {
      const candidate = correct + offset;
      if (candidate >= 0) alternatives.add(candidate);
      if (alternatives.size === 4) break;
    }
    for (let offset = 1; alternatives.size < 4; offset++) alternatives.add(correct + offset);
    return shuffle([...alternatives]);
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
    typedForm.hidden = true;
    choicesArea.hidden = true;
    operationElement.textContent = '';
    promptElement.textContent = 'Quanto é?';

    try {
      currentQuestion = await getNextQuestion();
      const typedMode = Math.random() < 0.5; // Independent choice on every new question.
      changeMascots();
      operationElement.textContent = `${currentQuestion.statement} = ?`;
      if (typedMode) {
        typedForm.hidden = false;
        promptElement.textContent = 'Digite a resposta:';
      } else {
        choicesArea.hidden = false;
        promptElement.textContent = 'Escolha a resposta:';
        for (const value of buildAlternatives(calculateLocalAnswer(currentQuestion))) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'choice';
          button.textContent = String(value);
          button.addEventListener('click', () => checkAnswer(value, button));
          choicesElement.append(button);
        }
      }
      answerLocked = false;
    } catch {
      currentQuestion = null;
      feedback.textContent = 'Ops! Não conseguimos preparar o desafio. Tente novamente!';
      feedback.classList.add('error');
      nextButton.innerHTML = 'Tentar novamente <span aria-hidden="true">➜</span>';
      nextButton.disabled = false;
      nextButton.classList.add('is-visible');
    }
  }

  async function checkAnswer(answer, chosenButton = null) {
    if (answerLocked || !currentQuestion) return;
    answerLocked = true;
    typedAnswer.disabled = true;
    typedForm.querySelector('button').disabled = true;
    const choiceButtons = [...choicesElement.querySelectorAll('button')];
    choiceButtons.forEach(button => { button.disabled = true; });

    try {
      const result = await submitAnswer(currentQuestion, answer);
      if (mode === 'adventure') {
        state = window.MathGame.record(result.correct, questionNumber);
        if (!state) {
          window.location.reload();
          return;
        }
        progressTrack.setAttribute('aria-valuenow', String(state.answered));
        progressFill.style.width = `${state.answered * 100 / window.MathGame.limit}%`;
      }
      if (result.correct) {
        feedback.textContent = 'Muito bem! Você acertou! ✦';
        feedback.classList.add('success');
        if (chosenButton) chosenButton.classList.add('is-correct');
      } else {
        feedback.textContent = `Quase! A resposta é ${calculateLocalAnswer(currentQuestion)}. ${state?.result ? 'Você concluiu a aventura!' : 'Vamos ao próximo?'}`;
        feedback.classList.add('error');
        if (chosenButton) chosenButton.classList.add('is-wrong');
        choiceButtons.find(button => Number(button.textContent) === calculateLocalAnswer(currentQuestion))?.classList.add('is-correct');
      }
      nextButton.innerHTML = state?.result ? 'Ver resultado <span aria-hidden="true">➜</span>' : 'Próximo desafio <span aria-hidden="true">➜</span>';
      nextButton.disabled = false;
      nextButton.classList.add('is-visible');
      nextButton.focus();
    } catch {
      feedback.textContent = 'Ops! Tente conferir sua resposta mais uma vez.';
      feedback.classList.add('error');
      answerLocked = false;
      typedAnswer.disabled = false;
      typedForm.querySelector('button').disabled = false;
      choiceButtons.forEach(button => { button.disabled = false; });
    }
  }

  typedForm.addEventListener('submit', event => {
    event.preventDefault();
    if (answerLocked) return;
    const raw = typedAnswer.value.trim();
    if (!/^-?\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) {
      feedback.textContent = 'Digite um número inteiro para continuar!';
      feedback.className = 'feedback error';
      typedAnswer.focus();
      return;
    }
    checkAnswer(Number(raw));
  });

  nextButton.addEventListener('click', () => {
    if (mode === 'adventure' && window.MathGame.read()?.result) {
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
  startQuestion();
})();
